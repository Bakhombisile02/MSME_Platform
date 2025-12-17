const { Sequelize, QueryTypes } = require('sequelize');
const Op = Sequelize.Op;
const BaseRepo = require('../services/BaseRepository');
const { MSMEBusinessModel, DirectorsInfoModel, BusinessOwnersModel } = require('../models');
const { validationResult } = require('express-validator');
const sendEmail = require('../mailer/mailerFile');
const ownershipService = require('../services/ownershipService');
const crypto = require('crypto');

// =============================================================================
// OTP BRUTE-FORCE PROTECTION
// =============================================================================
const otpAttempts = new Map(); // In production, use Redis
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCKOUT_MINUTES = 30;

function checkOtpRateLimit(email) {
    const key = email.toLowerCase();
    const record = otpAttempts.get(key);
    
    if (!record) return { allowed: true };
    
    // Check if lockout period has expired
    if (record.lockoutUntil && record.lockoutUntil > Date.now()) {
        const minutesLeft = Math.ceil((record.lockoutUntil - Date.now()) / 60000);
        return { 
            allowed: false, 
            message: `Too many failed attempts. Please try again in ${minutesLeft} minutes.`
        };
    }
    
    // Reset if lockout expired
    if (record.lockoutUntil && record.lockoutUntil <= Date.now()) {
        otpAttempts.delete(key);
        return { allowed: true };
    }
    
    return { allowed: true };
}

function recordOtpAttempt(email, success) {
    const key = email.toLowerCase();
    
    if (success) {
        otpAttempts.delete(key);
        return;
    }
    
    const record = otpAttempts.get(key) || { attempts: 0 };
    record.attempts += 1;
    
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
        record.lockoutUntil = Date.now() + (OTP_LOCKOUT_MINUTES * 60 * 1000);
    }
    
    otpAttempts.set(key, record);
}


module.exports.add = async (req, res, next) => {

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }
    const { directorsInfo, ...msmeData } = req.body;

    // console.log("msmeData ==> ", msmeData);

    const isEmailExist = await MSMEBusinessModel.findOne({ where: { email_address: msmeData.email_address } });
    if (isEmailExist) {
        return res.status(400).json({ error: 'This email is already registered. Please use a different email address.' });
    }

    const hashedPassword = await MSMEBusinessModel.hashPassword(msmeData.password.toString());
    msmeData.password = hashedPassword;

    try {
        const msme = await BaseRepo.baseCreate(MSMEBusinessModel, msmeData);
        if (!msme) {
            return res.status(400).json({ error: 'Error creating MSME Business' });
        }

        // Handle ownership and business owners
        if (msmeData.owners && Array.isArray(msmeData.owners)) {
            const validation = ownershipService.validateOwnership(msmeData.ownership_type || msmeData.ownershipType, msmeData.owners);
            if (!validation.valid) {
                await msme.destroy();
                return res.status(400).json({ error: validation.error });
            }

            // Compute gender summary
            const genderSummary = ownershipService.computeGenderSummary(msmeData.owners);
            await msme.update({ owner_gender_summary: genderSummary });

            // Create business owner records
            const owners = msmeData.owners.map(owner => ({
                business_id: msme.id,
                gender: owner.gender
            }));

            await BaseRepo.baseBulkCreate(BusinessOwnersModel, owners);
        }

        const directors = directorsInfo.map(director => ({
            ...director,
            business_id: msme.id
        }));

        const directorsInfoValues = await BaseRepo.baseBulkCreate(DirectorsInfoModel, directors);
        if (!directorsInfoValues) {
            return res.status(400).json({ error: 'Error creating MSME Business' });
        }

        // Send email to the user
        sendEmail(msmeData, 1, msmeData.email_address);

        res.status(201).json(
            {
                message: "MSME and directors saved successfully",
                data: {
                    msme: msme,
                    directors: directorsInfoValues
                }
            });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


module.exports.get = async (req, res, next) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const params = {
        searchParams: { is_verified: 2 },
        limit: limit,
        offset: offset,
        page: page,
        order: [["id", "DESC"]],
    }
    try {
        const msmeInfo = await BaseRepo.baseList(MSMEBusinessModel, params);
        if (!msmeInfo) {
            return res.status(400).json({ error: 'Error fetching Business Categories' });
        }
        res.status(201).json(msmeInfo);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


module.exports.checkEmailExists = async (req, res, next) => {

    const email_address = req.params.email_address;

    // Security note: For registration forms, we need to tell users if email exists
    // to prevent duplicate accounts. This is an acceptable trade-off.
    // The check-email endpoint is rate-limited at the global API level (100 req/15min)
    // For additional protection, consider adding CAPTCHA on the frontend.
    
    try {
        const isEmailExist = await MSMEBusinessModel.findOne({ 
            where: { email_address: email_address },
            attributes: ['id'] // Only fetch ID, not full record
        });
        if (isEmailExist) {
            return res.status(200).json({ exists: true });
        } else {
            return res.status(200).json({ exists: false });
        }
    }
    catch (error) {
        console.error(error);
        // Return generic error to not leak information
        return res.status(500).json({ error: 'Unable to verify email' });
    }
}



module.exports.getWeb = async (req, res, next) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const is_verified = req.params.is_verified;

    let params;
    if (is_verified === 0 || is_verified === "0" || is_verified === '0') {
        params = {
            searchParams: {},
            limit: limit,
            offset: offset,
            page: page,
            order: [["id", "DESC"]],
        }
    }
    else {
        params = {
            searchParams: { is_verified: is_verified },
            limit: limit,
            offset: offset,
            page: page,
            order: [["id", "DESC"]],
        }
    }
    try {
        const msmeInfo = await BaseRepo.baseList(MSMEBusinessModel, params);
        if (!msmeInfo) {
            return res.status(400).json({ error: 'Error fetching Business Categories' });
        }
        res.status(201).json(msmeInfo);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}




module.exports.getListAccordingToCategoryId = async (req, res, next) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const business_category_id = req.params.business_category_id;
    const is_verified = 2; // Default to 2 if not provided

    const params = {
        searchParams: {},
        limit: limit,
        offset: offset,
        page: page,
        order: [["id", "DESC"]],
    }

    try {
        const msmeInfo = await BaseRepo.baseList2(MSMEBusinessModel, params, business_category_id, is_verified);
        if (!msmeInfo) {
            return res.status(400).json({ error: 'Error fetching Business Categories' });
        }
        res.status(201).json(msmeInfo);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}




module.exports.getListAccordingToCategoryIdV2 = async (req, res, next) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const business_category_id = req.params.business_category_id;
    const is_verified = 2; // Default to 2 if not provided

    const params = {
        searchParams: {},
        limit: limit,
        offset: offset,
        page: page,
        order: [["id", "DESC"]],
    }

    try {
        const msmeInfo = await BaseRepo.baseList3(MSMEBusinessModel, params, business_category_id, is_verified);
        if (!msmeInfo) {
            return res.status(400).json({ error: 'Error fetching Business Categories' });
        }
        res.status(201).json(msmeInfo);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}





module.exports.getMSMEDetails = async (req, res, next) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const id = req.params.id;

    try {
        const msmeDetails = await BaseRepo.baseFindById(MSMEBusinessModel, id, "id");
        if (!msmeDetails) {
            return res.status(400).json({ error: 'Error fetching MSME details' });
        }

        const directorsDetail = await BaseRepo.baseFindAllById(DirectorsInfoModel, msmeDetails.dataValues.id, "business_id");
        if (!directorsDetail) {
            return res.status(400).json({ error: 'Error fetching directors details' });
        }

        // Fetch business owners
        const businessOwners = await BaseRepo.baseFindAllById(BusinessOwnersModel, msmeDetails.dataValues.id, "business_id");
        
        res.status(201).json({ 
            msmeDetails, 
            directorsDetail,
            businessOwners: businessOwners || []
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}




module.exports.update = async (req, res, next) => {

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }

    const { directorsInfo, owners, ...msmeData } = req.body;
    const id = req.params.id;

    try {
        console.log("Update request - ownership_type:", msmeData.ownership_type, "owners:", owners);
        
        // Handle ownership and business owners update
        if (msmeData.ownership_type && owners && Array.isArray(owners)) {
            const validation = ownershipService.validateOwnership(msmeData.ownership_type || msmeData.ownershipType, owners);
            if (!validation.valid) {
                console.log("Ownership validation failed:", validation.error);
                return res.status(400).json({ error: validation.error });
            }

            // Compute gender summary
            const genderSummary = ownershipService.computeGenderSummary(owners);
            msmeData.owner_gender_summary = genderSummary;

            // Delete existing owners and create new ones
            await BusinessOwnersModel.destroy({ where: { business_id: id } });
            
            const newOwners = owners.map(owner => ({
                business_id: id,
                gender: owner.gender
            }));

            await BaseRepo.baseBulkCreate(BusinessOwnersModel, newOwners);
        }

        const MSMEBusiness = await BaseRepo.baseUpdate(MSMEBusinessModel, { id }, msmeData);
        if (!MSMEBusiness) {
            return res.status(400).json({ error: 'Error updating MSME Business' });
        }

        res.status(201).json({
            message: 'MSME Business updated successfully',
            data: MSMEBusiness
        });
    }
    catch (error) {
        console.error("Update error:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



module.exports.delete = async (req, res, next) => {

    const id = req.params.id;

    try {
        const BusinessCategories = await BaseRepo.baseDelete(MSMEBusinessModel, { id });
        if (!BusinessCategories) {
            return res.status(400).json({ error: 'Error deleting Business Categories' });
        }
        res.status(201).json({
            message: 'Business Categories deleted successfully',
            data: BusinessCategories
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



module.exports.verifyMSME = async (req, res, next) => {

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }

    const payload = req.body;
    const id = req.params.id;

    try {
        const Business = await BaseRepo.baseUpdate(MSMEBusinessModel, { id }, payload);
        if (!Business) {
            return res.status(400).json({ error: 'Error updating MSME Business' });
        }

        // Send email to the user
        sendEmail(payload, payload.is_verified, payload.email_address);

        res.status(201).json({
            message: 'MSME Business updated successfully',
            data: Business
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports.searchByName = async (req, res, next) => {
    // DEPRECATED: Use /msme-business/filters?keyword=xxx instead for better search
    // This endpoint only searches name_of_organization field
    // The filters endpoint searches 17+ fields including description, products, services, location

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const name_of_organization = req.params.name_of_organization;

    try {
        // Enhanced search with pagination support
        const { count, rows } = await MSMEBusinessModel.findAndCountAll({
            where: {
                deletedAt: null,
                is_verified: 2,
                name_of_organization: {
                    [Op.like]: '%' + name_of_organization + '%',
                }
            },
            limit,
            offset,
            order: [['name_of_organization', 'ASC']],
        });

        // Return paginated response format matching filters API
        res.status(200).json({
            values: { rows, count },
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            // Deprecation notice in response
            _deprecated: 'This endpoint is deprecated. Use GET /msme-business/filters?keyword=xxx for enhanced multi-field search.'
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


module.exports.searchByRegion = async (req, res, next) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const region = req.params.region;

    const params = {
        searchParams: { region: region },
        limit: limit,
        offset: offset,
        page: page,
        order: [["id", "DESC"]],
    }
    try {
        const msmeInfo = await BaseRepo.baseList(MSMEBusinessModel, params);
        if (!msmeInfo) {
            return res.status(400).json({ error: 'Error fetching MSME Business' });
        }
        res.status(201).json(msmeInfo);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



module.exports.filtersAPI = async (req, res, next) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const is_verified = '2';

    const {
        business_category_id,
        business_sub_category_id,
        region,
        inkhundla,
        town,
        rural_urban_classification,
        employees,
        establishment_year,
        owner_gender,
        ownership_type,
        ownerType,
        business_type,
        turnover,
        disability_owned,
        keyword,
        sort,
    } = req.query;

    // Build a single Sequelize where clause so we can combine equals and OR conditions
    const whereClause = { is_verified };

    if (business_category_id && business_category_id !== 'All') {
        whereClause.business_category_id = business_category_id;
    }
    if (business_sub_category_id && business_sub_category_id !== 'All') {
        whereClause.business_sub_category_id = business_sub_category_id;
    }
    if (region && region !== 'All') {
        whereClause.region = region;
    }
    if (inkhundla && inkhundla !== 'All') {
        whereClause.inkhundla = inkhundla;
    }
    if (town && town.trim() !== '') {
        whereClause.town = town.trim();
    }
    if (rural_urban_classification && ['Rural','Urban','Semi Urban'].includes(rural_urban_classification)) {
        whereClause.rural_urban_classification = rural_urban_classification;
    }
    if (employees && employees !== 'All') {
        whereClause.employees = employees;
    }
    if (establishment_year && establishment_year !== 'All') {
        whereClause.establishment_year = establishment_year;
    }
    if (turnover && turnover !== 'All') {
        whereClause.turnover = turnover;
    }
    if (ownerType && ownerType !== 'All') {
        whereClause.ownerType = ownerType;
    }
    if (ownership_type && ['Individual','Partnership'].includes(ownership_type)) {
        whereClause.ownership_type = ownership_type;
    }

    if (typeof disability_owned === 'string') {
        const v = disability_owned.trim().toLowerCase();
        if (v === 'yes' || v === 'no') {
            whereClause.disability_owned = v === 'yes' ? 'Yes' : 'No';
        } else if (disability_owned === 'Yes' || disability_owned === 'No') {
            whereClause.disability_owned = disability_owned;
        }
    }

    if (typeof business_type === 'string') {
        let bt = business_type.trim();
        const map = { yes: 'Registered', no: 'Unregistered' };
        const lower = bt.toLowerCase();
        if (map[lower]) bt = map[lower];
        if (bt === 'Registered' || bt === 'Unregistered') {
            whereClause.business_type = bt;
        }
    }

    if (owner_gender && ['Male','Female','Both'].includes(owner_gender)) {
        whereClause.owner_gender_summary = owner_gender;
    }

    // Enhanced keyword search - uses LIKE queries for reliability
    // FULLTEXT indexes exist but require exact column matching
    // Using LIKE with indexes on common columns provides good performance
    let keywordOr = {};
    let searchTermsArray = [];
    
    if (keyword && keyword.trim() !== '') {
        searchTermsArray = keyword.trim().toLowerCase().split(/\s+/); // Split by whitespace
        console.log('🔍 Search terms:', searchTermsArray);
        
        // Create search conditions for each term using LIKE
        // All terms must match (AND logic) but each term can match any field (OR logic)
        const termConditions = searchTermsArray.map(term => {
            const like = '%' + term + '%';
            return {
                [Op.or]: [
                    // Business identity
                    { name_of_organization: { [Op.like]: like } },
                    { business_category_name: { [Op.like]: like } },
                    { business_sub_category_name: { [Op.like]: like } },
                    { business_type: { [Op.like]: like } },
                    
                    // Business details
                    { brief_company_description: { [Op.like]: like } },
                    { product_offered: { [Op.like]: like } },
                    { service_offered: { [Op.like]: like } },
                    
                    // Location
                    { town: { [Op.like]: like } },
                    { region: { [Op.like]: like } },
                    { inkhundla: { [Op.like]: like } },
                    { street_address: { [Op.like]: like } },
                    
                    // Contact information
                    { contact_number: { [Op.like]: like } },
                    { email_address: { [Op.like]: like } },
                    { primary_contact_name: { [Op.like]: like } },
                    
                    // Business characteristics
                    { ownerType: { [Op.like]: like } },
                    { ownership_type: { [Op.like]: like } },
                    { rural_urban_classification: { [Op.like]: like } },
                ]
            };
        });
        
        // Use AND logic: all search terms must match (in any field)
        if (termConditions.length > 0) {
            keywordOr = { [Op.and]: termConditions };
        }
        
        console.log('✓ Search conditions created for', searchTermsArray.length, 'term(s)');
    }

    // Sorting
    let order = [["id", "DESC"]];
    if (sort) {
        switch (sort) {
            case 'newest': order = [["id", "DESC"]]; break;
            case 'oldest': order = [["id", "ASC"]]; break;
            case 'name_asc': order = [["name_of_organization", "ASC"]]; break;
            case 'name_desc': order = [["name_of_organization", "DESC"]]; break;
            case 'relevance': 
                // For relevance, prioritize name matches then sort alphabetically
                if (keyword && keyword.trim() !== '') {
                    order = [["name_of_organization", "ASC"]];
                } else {
                    order = [["id", "DESC"]];
                }
                break;
            default: break;
        }
    }

    const params = {
        where: { ...whereClause, ...keywordOr },
        limit,
        offset,
        page,
        order,
    };

    try {
        const msmeInfo = await BaseRepo.baseList(MSMEBusinessModel, params);
        if (!msmeInfo) {
            return res.status(400).json({ error: 'Error fetching MSME Business' });
        }
        
        // Add search highlighting metadata if keyword search was performed
        let response = msmeInfo;
        if (searchTermsArray.length > 0 && msmeInfo.values?.rows) {
            // Add matched fields info for highlighting on frontend
            response = {
                ...msmeInfo,
                searchMeta: {
                    terms: searchTermsArray,
                    highlightFields: [
                        'name_of_organization',
                        'brief_company_description', 
                        'product_offered',
                        'service_offered',
                        'town',
                        'region',
                        'business_category_name',
                        'business_sub_category_name'
                    ]
                }
            };
        }
        
        res.status(200).json(response);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


module.exports.loginUser = async (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }
    const { email_address, password } = req.body;

    // Use scope to include password for authentication
    const user = await MSMEBusinessModel.scope('withPassword').findOne({ where: { email_address } });
    if (!user) {
        return res.status(400).json({ error: 'Invalid login credentials. Please check your email and password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.status(400).json({ error: 'Invalid login credentials. Please check your email and password.' });
    }
    
    const token = await user.generateAuthToken(); // ✅ instance method
    
    // Create safe user object without sensitive fields
    const userJson = user.toJSON();
    const { password: _, otp, otp_expiry, otp_verified, reset_token, reset_token_expiry, ...safeUserData } = userJson;
    safeUserData.user_type = "user";
    
    res.status(200).json({ user: safeUserData, token });
};



module.exports.forgetPasswordSendEmail = async (req, res, next) => {

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }

    const { email_address } = req.body;

    // Check rate limit
    const rateCheck = checkOtpRateLimit(email_address);
    if (!rateCheck.allowed) {
        return res.status(429).json({ error: rateCheck.message });
    }

    const isEmailExist = await MSMEBusinessModel.findOne({ where: { email_address: email_address } });
    if (!isEmailExist) {
        // Return success even if email doesn't exist (security: prevent email enumeration)
        return res.status(200).json({ message: 'If this email exists, an OTP has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expiry = new Date(Date.now() + 10 * 60000); // 10 minutes from now

    const payload = { 
        otp: otp, 
        otp_expiry: otp_expiry,
        otp_verified: false,
        reset_token: null 
    };

    try {
        const Business = await BaseRepo.baseUpdate(MSMEBusinessModel, { email_address }, payload);
        if (!Business) {
            return res.status(400).json({ error: 'Error processing request' });
        }

        // Send email to the user
        sendEmail(payload, 4, email_address);

        res.status(200).json({
            message: 'If this email exists, an OTP has been sent.',
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



module.exports.forgetPasswordVerifyOTP = async (req, res, next) => {

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }

    const { email_address, otp } = req.body;

    // Check rate limit
    const rateCheck = checkOtpRateLimit(email_address);
    if (!rateCheck.allowed) {
        return res.status(429).json({ error: rateCheck.message });
    }

    try {
        // Use scope to access OTP fields
        const record = await MSMEBusinessModel.scope('withOTP').findOne({ 
            where: { email_address: email_address, otp: otp } 
        });
        
        if (!record || record.otp_expiry < new Date()) {
            recordOtpAttempt(email_address, false);
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // Generate secure reset token
        const reset_token = crypto.randomBytes(32).toString('hex');
        const reset_token_expiry = new Date(Date.now() + 5 * 60000); // 5 minutes to reset

        // Mark OTP as verified and store reset token (invalidates OTP)
        await BaseRepo.baseUpdate(MSMEBusinessModel, { email_address }, {
            otp: null,
            otp_expiry: null,
            otp_verified: true,
            reset_token: reset_token,
            reset_token_expiry: reset_token_expiry
        });

        recordOtpAttempt(email_address, true);

        res.status(200).json({
            message: 'OTP verified successfully',
            reset_token: reset_token // Client must use this within 5 minutes
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



module.exports.forgetPassword = async (req, res, next) => {

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }

    const { email_address, password, reset_token } = req.body;

    try {
        // Use scope to access reset token fields
        const record = await MSMEBusinessModel.scope('withOTP').findOne({ 
            where: { 
                email_address: email_address, 
                reset_token: reset_token,
                otp_verified: true
            } 
        });

        if (!record) {
            return res.status(400).json({ error: 'Invalid reset request. Please start over.' });
        }

        if (record.reset_token_expiry && record.reset_token_expiry < new Date()) {
            return res.status(400).json({ error: 'Reset session expired. Please request a new OTP.' });
        }

        const hashedPassword = await MSMEBusinessModel.hashPassword(password.toString());

        const payload = { 
            password: hashedPassword, 
            otp: null, 
            otp_expiry: null,
            otp_verified: false,
            reset_token: null,
            reset_token_expiry: null
        };

        const Business = await BaseRepo.baseUpdate(MSMEBusinessModel, { email_address }, payload);
        if (!Business) {
            return res.status(400).json({ error: 'Error updating password' });
        }

        res.status(200).json({
            message: 'Password reset successfully'
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


// =============================================================================
// LEGACY ROUTES - REMOVED FOR SECURITY
// =============================================================================
// The following controller functions have been removed because their routes
// exposed sensitive data (email, OTP, password) in URLs:
// - forgetPasswordSendEmailLegacy
// - forgetPasswordVerifyOTPLegacy  
// - forgetPasswordLegacy
//
// Use the secure POST-based methods above instead.


// =============================================================================
// SEARCH AUTOCOMPLETE
// =============================================================================
/**
 * Get search suggestions for autocomplete
 * Returns business names, categories, towns that match the query
 * 
 * @route GET /api/msme-business/autocomplete
 * @query {string} q - Search query (min 2 characters)
 * @query {number} limit - Max results per category (default: 5)
 */
module.exports.autocomplete = async (req, res) => {
    const { q, limit = 5 } = req.query;
    
    if (!q || q.trim().length < 2) {
        return res.status(200).json({ suggestions: [] });
    }
    
    const searchTerm = q.trim().toLowerCase();
    const limitNum = Math.min(parseInt(limit) || 5, 10); // Cap at 10
    
    try {
        const like = `%${searchTerm}%`;
        
        // Get matching business names
        const businesses = await MSMEBusinessModel.findAll({
            where: {
                is_verified: 2,
                name_of_organization: { [Op.like]: like }
            },
            attributes: ['id', 'name_of_organization', 'business_category_name', 'town'],
            limit: limitNum,
            order: [['name_of_organization', 'ASC']]
        });
        
        // Get unique matching categories
        const categories = await MSMEBusinessModel.findAll({
            where: {
                is_verified: 2,
                business_category_name: { [Op.like]: like }
            },
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('business_category_name')), 'name']],
            limit: limitNum
        });
        
        // Get unique matching sub-categories
        const subCategories = await MSMEBusinessModel.findAll({
            where: {
                is_verified: 2,
                business_sub_category_name: { [Op.like]: like }
            },
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('business_sub_category_name')), 'name']],
            limit: limitNum
        });
        
        // Get unique matching towns
        const towns = await MSMEBusinessModel.findAll({
            where: {
                is_verified: 2,
                town: { [Op.like]: like }
            },
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('town')), 'name']],
            limit: limitNum
        });
        
        // Get unique matching services
        const services = await MSMEBusinessModel.findAll({
            where: {
                is_verified: 2,
                service_offered: { [Op.like]: like }
            },
            attributes: ['service_offered'],
            limit: limitNum * 2 // Get more since we'll extract unique terms
        });
        
        // Extract unique service keywords that match
        const serviceKeywords = new Set();
        services.forEach(s => {
            if (s.service_offered) {
                // Split by common delimiters and find matching parts
                const parts = s.service_offered.split(/[,;\/\n]+/);
                parts.forEach(part => {
                    const trimmed = part.trim();
                    if (trimmed.toLowerCase().includes(searchTerm) && trimmed.length < 50) {
                        serviceKeywords.add(trimmed);
                    }
                });
            }
        });
        
        // Build suggestions array with types
        const suggestions = [];
        
        // Add businesses
        businesses.forEach(b => {
            suggestions.push({
                type: 'business',
                id: b.id,
                text: b.name_of_organization,
                subtext: `${b.business_category_name || 'Business'}${b.town ? ` • ${b.town}` : ''}`
            });
        });
        
        // Add categories
        categories.forEach(c => {
            if (c.dataValues.name) {
                suggestions.push({
                    type: 'category',
                    text: c.dataValues.name,
                    subtext: 'Category'
                });
            }
        });
        
        // Add sub-categories
        subCategories.forEach(sc => {
            if (sc.dataValues.name) {
                suggestions.push({
                    type: 'subcategory',
                    text: sc.dataValues.name,
                    subtext: 'Sub-category'
                });
            }
        });
        
        // Add towns
        towns.forEach(t => {
            if (t.dataValues.name) {
                suggestions.push({
                    type: 'location',
                    text: t.dataValues.name,
                    subtext: 'Location'
                });
            }
        });
        
        // Add service keywords (limited)
        Array.from(serviceKeywords).slice(0, limitNum).forEach(s => {
            suggestions.push({
                type: 'service',
                text: s,
                subtext: 'Service'
            });
        });
        
        res.status(200).json({ 
            suggestions,
            query: searchTerm
        });
        
    } catch (error) {
        console.error('Autocomplete error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


// =============================================================================
// POPULAR SEARCHES
// =============================================================================
/**
 * Get popular/suggested search terms
 * Returns common categories, locations, and services for search suggestions
 * 
 * @route GET /api/msme-business/popular-searches
 */
module.exports.popularSearches = async (req, res) => {
    try {
        // Get top categories by business count
        const topCategories = await MSMEBusinessModel.findAll({
            where: { is_verified: 2 },
            attributes: [
                'business_category_name',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['business_category_name'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 6
        });
        
        // Get top towns by business count
        const topTowns = await MSMEBusinessModel.findAll({
            where: { 
                is_verified: 2,
                town: { [Op.ne]: null, [Op.ne]: '' }
            },
            attributes: [
                'town',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['town'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 4
        });
        
        // Get top regions
        const topRegions = await MSMEBusinessModel.findAll({
            where: { 
                is_verified: 2,
                region: { [Op.ne]: null, [Op.ne]: '' }
            },
            attributes: [
                'region',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['region'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 4
        });
        
        res.status(200).json({
            categories: topCategories.map(c => ({
                text: c.business_category_name,
                count: parseInt(c.dataValues.count)
            })).filter(c => c.text),
            locations: [
                ...topTowns.map(t => ({
                    text: t.town,
                    type: 'town',
                    count: parseInt(t.dataValues.count)
                })),
                ...topRegions.map(r => ({
                    text: r.region,
                    type: 'region',
                    count: parseInt(r.dataValues.count)
                }))
            ].filter(l => l.text)
        });
        
    } catch (error) {
        console.error('Popular searches error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};