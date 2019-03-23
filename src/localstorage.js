const fs = require('fs')
const { promisify } = require('util')
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
    catch(error) {
      fs.writeFileSync(path, JSON.stringify({}), 'utf8')
    }
  })()
  /**
   * Read the exist localstorage file and return the present data
   */
  async function readLocalstorageFile() {
    try {
      const file = await readFile(path, { encoding: 'utf8' })
      return JSON.parse(file)
    }
    catch (error) {
      console.log(error)
      return null
    }
  }
  /**
   * Given a key and one value, save this value in the localstorage file
   * @param {String} key 
   * @param {String | Number | Boolean | Object | Array} value 
   */
  async function setItem(key, value) {
    try {
      const data = await readLocalstorageFile()
      if (data) {
        const newData = {...data}
        newData[key] = value
        await writeFile(path, JSON.stringify(newData), 'utf8')
      }
    }
    catch (error) {
      console.log(error)
    }
  }
  /**
   * Given one key returns that item from localstorage, undefined if doesn't exists
   * @param {String} key 
   */
  async function getItem(key) {
    try {
      const data = await readLocalstorageFile()
      if (data && !data[key]) {
        return undefined
      }

      return data[key]
    }
    catch (error) {
      console.log(error)
    }
  }
  /**
   * Given a key remove that item from localstorage file
   * @param {String} key 
   */
  async function removeItem(key) {
    try {
      const data = await readLocalstorageFile()

      if (!data) {
        throw new Error('Error reading file')
      }

      if (!data[key]) {
        throw new Error(`The file doesn't have the key ${key}`)
      }

      const newData = {...data}
      delete newData[key]
      await writeFile(path, JSON.stringify(newData), 'utf8')
    }
    catch (error) {
      console.log(error)
    }
  }

  /**
   * Clear whole file of the localstorage
   */
  async function removeAll() {
    try {
      await writeFile(path, JSON.stringify({}), 'utf8')
    }
    catch(error) {
      console.log(error)
    }
  }

  return {
    setItem,
    getItem,
    removeItem,
    removeAll,
  }
}