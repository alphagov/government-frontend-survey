const fs = require('fs')
const outdent = require('outdent')
const GithubSlugger = require('github-slugger')
let slugger = new GithubSlugger()

function getTotals (data) {
  return data.map(response => {
    const total = (
      Object
        .entries(response.answers)
        .map(answer => answer[1])
        // Add all answer results together
        .reduce((a, b) => a + b, 0)
    )
    return {
      ...response,
      total
    }
  })
}

const UNDEFINED_LABEL = 'N/A'

function mergeAndSum (start, end) {
  // Warning, crap lazy code incoming...
  
  Object
  .entries(end)
  .forEach(obj => {
    let key = obj[0]
    let value = obj[1]
    end[key] = [UNDEFINED_LABEL, value]
  })
  
  Object
  .entries(start)
  .forEach(obj => {
    let key = obj[0]
    let value = obj[1]
    start[key] = [value, UNDEFINED_LABEL]
  })

  let mergedObject = start
  
  // Sum up shared keys
  Object
    .entries(end)
    .forEach(obj => {
      let key = obj[0]
      let value = obj[1]
      if (typeof mergedObject[key] !== 'undefined') {
        mergedObject[key][1] = value[1]
      }
    })

  Object
    .entries(end)
    .forEach(obj => {
      let key = obj[0]
      let value = obj[1]
      if (typeof mergedObject[key] !== 'undefined') {
        mergedObject[key].push(value[0])
      }
    })
    
  // Merge in any keys that were not shared
  return Object.assign({}, end, mergedObject)
}

function generateComparison (startYear, endYear) {
  const startData = require(`./data/${startYear}.json`)
  const endData = require(`./data/${endYear}.json`)
  const notes = require(`./data/${startYear}-${endYear}-notes.json`)

  const startResponses = getTotals(startData)
  const endResponses = getTotals(endData)  
  
  let output = outdent`
    # Government Frontend Survey Results

    ## Comparison between ${startYear} and ${endYear}
  `

startResponses.forEach(response => {
  slugger.reset()

  let endResponse = endResponses.find(endResponse => endResponse.id === response.id)
    const mergedAndSummedAnswers = mergeAndSum(
      response.answers,
      endResponse.answers
    )

    const title = `Question ${response.id}: ${response.question}`
    const slug = slugger.slug(title)
    const noteText = notes.filter(note => note.id === response.id).map(note => note.text)

    let answers
    if (response.type === 'open') {
      const formattedAnswers =
        Object
          .entries(mergedAndSummedAnswers)

          .map(answer => {
            if (answer[1][0] !== UNDEFINED_LABEL) {
              if (answer[1][0] === 'Done') {
                answer[1][0] = 'N/A (Done)'
              } else {
                answer[1][0] = 'Yes'
              }
            } else {
              answer[1][0] = 'No'
            }

            if (answer[1][1] !== UNDEFINED_LABEL) {
              if (answer[1][1] === 'Done') {
                answer[1][1] = 'N/A (Done)'
              } else {
                answer[1][1] = 'Yes'
              }
            } else {
              answer[1][1] = 'No'
            }
          
            return answer
          })
          .sort((a, b) => {
            const valueA = (a[1][0])
            const valueB = (b[1][0])
            const valueEndA = (a[1][1])
            const valueEndB = (b[1][1])
            if (
              (valueB + valueEndB) <
              (valueA + valueEndA)
            ) {
              return -1;
            }
            return 1;
          })
          .map(answer => {
            let key = answer[0]
            let value = answer[1][0]
            let endValue = answer[1][1]
          
            return `| ${key} | ${value} | ${endValue} |`
          }).join('\n')
      answers = outdent`
        | Name | ${startYear} | ${endYear} |
        | --- | --- | --- |
        ${formattedAnswers}
      `
    } else {
      const formattedAnswers =
        Object
          .entries(mergedAndSummedAnswers)
          .map(answer => {
            let value = answer[1][0]
            let endValue = answer[1][1]

            let percentage = !isNaN(value) ? ((value / response.total) * 100).toFixed(1) : 0
            let endPercentage = !isNaN(endValue) ? ((endValue / endResponse.total) * 100).toFixed(1) : 0
            answer[1][0] = percentage
            answer[1][1] = endPercentage
            return answer
          })
          .sort((a, b) => {
            const valueA = parseInt(a[1][1])
            const valueB = parseInt(b[1][1])
            if (valueA > valueB) {
              return -1;
            }
            return 1;
          })
          .map(answer => {
            let key = answer[0]
            let value = answer[1][0] ? answer[1][0] + '%' : UNDEFINED_LABEL
            
            let endValue = answer[1][1] ? answer[1][1] + '%' : UNDEFINED_LABEL

            return `| ${key} | ${value} | ${endValue} |`
          }).join('\n')
      answers = outdent`
        | Name | Percentage (${startYear}) | Percentage (${endYear}) |
        | --- | --- | --- |
        ${formattedAnswers}
      `
    }
    output += outdent`

      ### Question ${response.id}: ${response.question}

      ${noteText}

      #### Answers

      ${answers}

      #### Sources

      - [${startYear} results for question ${response.id}](./results-${startYear}.md#${slug})
      - [${endYear} results for question ${response.id}](./results-${endYear}.md#${slug})

    `
  })
  
  fs.writeFile(`./comparison-${startYear}-${endYear}.md`, output, (error) => {
    if (error) {
      return console.log(err)
    }
    console.log(`comparison-${startYear}-${endYear}.md updated`)
  })
}

generateComparison(2016, 2018)