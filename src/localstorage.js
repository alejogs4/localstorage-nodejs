const fs = require('fs')
const { promisify } = require('util')
const EventEmitter = require('events').EventEmitter
/**
 * Convert standalone fs callbacks functions in promises
 */
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
/**
 * function that represent whole functions to manipulate localstorages
 */
module.exports = function setupLocalStorage(path) {
  /**
   * IIFE function to create localstorage if this one don't exist
   */
  (function createLocalStorage() {
    try {
      fs.accessSync(path, fs.constants.F_OK)
    }
    catch (error) {
      fs.writeFileSync(path, JSON.stringify({}), 'utf8')
    }
  })()

  const localstorageEvents = new EventEmitter()
  /**
 * Events to listen in library execution
 */
  const LOCALSTORAGE_SET = 'LOCALSTORAGE_SET'
  const LOCALSTORAGE_REMOVE = 'LOCALSTORAGE_REMOVE'
  const LOCALSTORAGE_CLEAR = 'LOCALSTORAGE_CLEAR'

  /**
   * Function to manage any error in library execution
   * TODO: If you know a better way to manage error in async/await functions, feel free to send pull request
   * @param {Function} promise 
   * @param  {...any} args 
   */
  async function handleError(promise, ...args) {
    return new Promise((resolve) => {
      promise(...args)
        .then((result) => resolve({ result, error: undefined }))
        .catch((error) => {
          console.log(error.message)
          resolve({ error, result: undefined })
        })
    })
  }

  /**
   * Read the exist localstorage file and return the present data
   */
  async function readLocalstorageFile() {
    const { result, error } = await handleError(readFile, path, { encoding: 'utf8' })
    if (error) return null
    return JSON.parse(result)
  }

  /**
   * Given a key and one value, save this value in the localstorage file
   * @param {String} key 
   * @param {String | Number | Boolean | Object | Array} value 
   */
  async function setItem(key, value) {
    const { result, error } = await handleError(readLocalstorageFile)
    if (error) return null

    if (result) {
      const newData = { ...result }
      newData[key] = value

      await handleError(writeFile, path, JSON.stringify(newData), 'utf8')
      localstorageEvents.emit(LOCALSTORAGE_SET, value)
    }
  }

  /**
   * Given one key returns that item from localstorage, undefined if doesn't exists
   * @param {String} key 
   */
  async function getItem(key) {
    const { result, error } = await handleError(readLocalstorageFile)

    if (error || (result && !result[key])) return undefined

    return result[key]
  }

  /**
   * Given a key remove that item from localstorage file
   * @param {String} key 
   */
  async function removeItem(key) {
    const { result, error } = await handleError(readLocalstorageFile)

    if (error || !result || !result[key]) return

    const newData = { ...result }
    delete newData[key]

    await handleError(writeFile, path, JSON.stringify(newData), 'utf8')
    localstorageEvents.emit(LOCALSTORAGE_REMOVE, result[key])
  }

  /**
   * Clear whole file of the localstorage
   */
  async function removeAll() {
    await handleError(writeFile, path, JSON.stringify({}), 'utf8')
    localstorageEvents.emit(LOCALSTORAGE_CLEAR, null)
  }

  return {
    setItem,
    getItem,
    removeItem,
    removeAll,
    LOCALSTORAGE_SET,
    LOCALSTORAGE_REMOVE,
    LOCALSTORAGE_CLEAR,
    on: function(event, listener) {
      return localstorageEvents.on(event, listener)
    }
  }
}