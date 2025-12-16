/**
 * Mock for models/index.js module
 * This file provides test mocks for all Sequelize models
 * Location: models/__mocks__/index.js (mirrors models/index.js)
 */

// Store the mock implementations so tests can configure them
const mockStore = {
  adminFindOne: jest.fn(),
  msmeFindOne: jest.fn(),
  msmeUpdate: jest.fn().mockResolvedValue([1]), // Sequelize update returns [affectedCount]
};

// AdminModel mock with scope support
const AdminModel = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  scope: jest.fn().mockImplementation(() => ({
    findOne: mockStore.adminFindOne,
  })),
};

// MSMEBusinessModel mock with scope support
const MSMEBusinessModel = {
  findOne: mockStore.msmeFindOne,
  findByPk: jest.fn(),
  findAll: jest.fn().mockResolvedValue([]),
  create: jest.fn(),
  update: mockStore.msmeUpdate,
  destroy: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
  hashPassword: jest.fn().mockImplementation(async (pwd) => `hashed_${pwd}`),
  scope: jest.fn().mockImplementation(() => ({
    findOne: mockStore.msmeFindOne,
  })),
};

// Other models
const DirectorsInfoModel = {
  findAll: jest.fn().mockResolvedValue([]),
  bulkCreate: jest.fn(),
  destroy: jest.fn(),
  create: jest.fn(),
};

const BusinessOwnersModel = {
  findAll: jest.fn().mockResolvedValue([]),
  bulkCreate: jest.fn(),
  destroy: jest.fn(),
  create: jest.fn(),
};

const BusinessCategoriesModel = {
  findAll: jest.fn().mockResolvedValue([]),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

const BusinessSubCategoriesModel = {
  findAll: jest.fn().mockResolvedValue([]),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

const ServiceProvidersModel = {
  findAll: jest.fn().mockResolvedValue([]),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
};

const ServiceProviderCategoriesModel = {
  findAll: jest.fn().mockResolvedValue([]),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

const blogModel = {
  findAll: jest.fn().mockResolvedValue([]),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

const FAQModel = {
  findAll: jest.fn().mockResolvedValue([]),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

const HomeBannerModel = {
  findAll: jest.fn().mockResolvedValue([]),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

const TeamModel = {
  findAll: jest.fn().mockResolvedValue([]),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

const DownloadModel = {
  findAll: jest.fn().mockResolvedValue([]),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

const ContactUsModel = {
  findAll: jest.fn().mockResolvedValue([]),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
};

const FeedbackModel = {
  findAll: jest.fn().mockResolvedValue([]),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
};

const SubscribeModel = {
  findAll: jest.fn().mockResolvedValue([]),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
};

const PartnersLogoModel = {
  findAll: jest.fn().mockResolvedValue([]),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

// Sequelize instance mock
const sequelize = {
  authenticate: jest.fn().mockResolvedValue(true),
  sync: jest.fn().mockResolvedValue(true),
  query: jest.fn().mockResolvedValue([]),
  literal: jest.fn((val) => val),
  fn: jest.fn(),
  col: jest.fn(),
  where: jest.fn(),
  define: jest.fn(),
  transaction: jest.fn().mockImplementation(async (fn) => {
    const t = { commit: jest.fn(), rollback: jest.fn() };
    return fn ? fn(t) : t;
  }),
};

// Sequelize class mock
const Sequelize = {
  Op: {
    or: Symbol('or'),
    and: Symbol('and'),
    like: Symbol('like'),
    gte: Symbol('gte'),
    lte: Symbol('lte'),
    gt: Symbol('gt'),
    lt: Symbol('lt'),
    ne: Symbol('ne'),
    eq: Symbol('eq'),
    in: Symbol('in'),
    notIn: Symbol('notIn'),
    between: Symbol('between'),
    iLike: Symbol('iLike'),
  },
  literal: jest.fn((val) => val),
  fn: jest.fn(),
  col: jest.fn(),
};

module.exports = {
  __mockStore: mockStore,
  AdminModel,
  MSMEBusinessModel,
  DirectorsInfoModel,
  BusinessOwnersModel,
  BusinessCategoriesModel,
  BusinessSubCategoriesModel,
  ServiceProvidersModel,
  ServiceProviderCategoriesModel,
  blogModel,
  FAQModel,
  HomeBannerModel,
  TeamModel,
  DownloadModel,
  ContactUsModel,
  FeedbackModel,
  SubscribeModel,
  PartnersLogoModel,
  sequelize,
  Sequelize,
};
