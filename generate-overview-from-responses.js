const fs = require('fs')
const path = require('path')

const csvjson = require('csvjson')
const csvJsonOptions = {
  delimiter: ',',
  quote: ''
}

const questionsData = require('./data/questions.json')

const OUTPUT_FILENAME = '2017.json'

fs.readFile(path.join(__dirname, 'responses.csv'), (error, results) => {
  if (error) {
    return console.log(err)
  }
  const data = results.toString()
  // const responses = csvjson.toObject(data, csvJsonOptions)
  const responses = require('./responses.json')

  // Remove empty results
  const strippedResponses =
    responses
      .filter((response) => {
        const emptyResponse = (
          Object
            .entries(response)
            .map(response => {
              return response[1]
            })
            .join('')
            .length
        ) === 0
        return !emptyResponse
      })

  let answersOverview = questionsData
  
  strippedResponses.forEach(response => {
    Object.keys(response).forEach(question => {
      const questionKey = response[question]
      if (!questionKey) {
        return
      }
      const matchedQuestion = answersOverview.find(answer => {
        return answer.id == question
      })
      if (matchedQuestion) {
        matchedQuestion.answers = (matchedQuestion.answers || {})
        const keys = questionKey.split(',').map(key => {
          return key.trim()
        })
        keys.forEach(key => {
          if(matchedQuestion.answers[key]) {
            matchedQuestion.answers[key] += 1
          } else {
            matchedQuestion.answers[key] = 1
          }
        })
      }
    })
  })
  

  const output = JSON.stringify(answersOverview, null, 2)

  fs.writeFile(`data/${OUTPUT_FILENAME}`, output, (error) => {
    if (error) {
      return console.log(err)
    }
    console.log(`data/${OUTPUT_FILENAME} updated`)
  })
})
 
