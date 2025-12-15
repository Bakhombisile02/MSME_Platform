const { AdminModel } = require('../models');
const {validationResult} = require('express-validator');

module.exports.ragisterAdmin = async (req, res, next) => {

    const error = validationResult(req);
    if(!error.isEmpty()){
        return res.status(400).json({error: error.array()});
    }

    const {email, password, name} = req.body;

    // Check if admin exists (using default scope without password)
    const isAdminExist = await AdminModel.findOne({ where: { email } });
    if(isAdminExist){
        return res.status(400).json({error: 'Admin already exist'});
    }


    const hashedPassword = await AdminModel.hashPassword(password.toString());
    const admin = await AdminModel.create({
        email,
        password: hashedPassword,
        name: name,
    });

    // Return admin data without password
    const adminData = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        user_type: admin.user_type || 'admin'
    };

    res.status(201).json(adminData);
}


module.exports.loginAdmin = async (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }

    const { email, password } = req.body;

    // Use scope to include password for authentication
    const admin = await AdminModel.scope('withPassword').findOne({ 
        where: {email}, 
        attributes: ['id', 'email', 'password', 'name', 'user_type']
    });
    if (!admin) {
        return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await admin.comparePassword(password); 
    if (!isMatch) {
        return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = await admin.generateAuthToken(); // ✅ instance method

    // Return admin data WITHOUT password
    const adminData = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        user_type: admin.user_type || 'admin'
    };

    res.status(200).json({ admin: adminData, token });
};


module.exports.logout = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if(!token){
        return res.status(401).json({error: 'Unauthorized'});
    }
    await AdminModel.update(
        { token: '' },   
        { where: { token: token }}  
    );
    res.status(200).json({message: 'Logout successfully'});
}
