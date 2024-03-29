import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validator'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
// Define Collection (name & schema)
const CARD_COLLECTION_NAME = 'cards'
const CARD_COLLECTION_SCHEMA = Joi.object({
  // regex
  boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  columnId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),

  title: Joi.string().required().min(2).max(50).trim().strict(),
  // có or ko !
  description: Joi.string().allow('').optional(),
  // images: Joi.string().allow('').optional(),
  images: Joi.string().allow('').optional(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})
const validateBeforeCreate = async (data) => {
  return await CARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: true })
}
const createdNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const newCardToAdd = {
      ...validData,
      boardId: new ObjectId(validData.boardId),
      columnId: new ObjectId(validData.columnId),
      // images: validData.images.map((base64Image) => Buffer.from(base64Image, 'base64'))
      images: validData.images
    }

    const result = await GET_DB().collection(CARD_COLLECTION_NAME).insertOne(newCardToAdd)

    // Check if the insertion was successful
    if (result && result.insertedId) {
      const createdCard = await GET_DB().collection(CARD_COLLECTION_NAME).findOne({ _id: result.insertedId })
      return createdCard
    } else {
      throw new Error('Failed to insert the new card')
    }
  } catch (error) {
    throw new Error(error)
  }
}


const fineOneById = async (id) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOne({
      _id: new ObjectId(id)
    })
    // Check if the document was found
    if (result) {
      return result
    } else {
      throw new Error('No card found with the specified ID')
    }
  } catch (error) {
    throw new Error(error)
  }
}

// delete all cards by columnId
const deleteAllCardById = async (columnId) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).deleteMany({
      columnId : new ObjectId(columnId)
    })
    console.log('result delete in card model', result)
    return result
  } catch (error) {
    console.error('Error deleting column:', error)
    throw new Error(error) }
}
const updateCard = async (id, updateData) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after', useFindAndModify: false }
    )
    console.log('result update in card model', result)
    return result.value
  } catch (error) {
    console.error('Error updating card:', error)
    throw new Error(error)
  }
}
export const cardModel = {
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA,
  createdNew,
  fineOneById,
  deleteAllCardById,
  updateCard
}