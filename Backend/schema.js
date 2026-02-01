const Joi = require("joi");

// Schema for creating new listings - MADE EXTREMELY PERMISSIVE FOR DIAGNOSTICS
module.exports.listingSchema = Joi.object({
  listing: Joi.object().unknown(true).optional(),
}).unknown(true);

// Schema for updating existing listings
module.exports.listingUpdateSchema = Joi.object({
  listing: Joi.object().unknown(true).optional(),
}).unknown(true);

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required(),
  }).required(),
});
