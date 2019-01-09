const fs = require('fs')
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

  const startResponses = getTotals(startData)
  const endResponses = getTotals(endData)  
  
  let output = `# Government Frontend Survey Results

## Comparison between ${startYear} and ${endYear}
`

startResponses.forEach(response => {
  slugger.reset()

  let endResponse = endResponses.find(endResponse => endResponse.id === response.id)
    const mergedAndSummedAnswers = mergeAndSum(
      response.answers,
      endResponse.answers
    )

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

    const title = `Question ${response.id}: ${response.question}`
    const slug = slugger.slug(title)
    output += (

  
  `
### Question ${response.id}: ${response.question}

#### Answers

- [Results from question ${response.id}, ${startYear}](./results-${startYear}.md#${slug})
- [Results from question ${response.id}, ${endYear}](./results-${endYear}.md#${slug})

| Name | Percentage (${startYear}) | Percentage (${endYear}) |
| --- | --- | --- |
${formattedAnswers}
`

    )
  })
  
  fs.writeFile(`./comparison-${startYear}-${endYear}.md`, output, (error) => {
    if (error) {
      return console.log(err)
    }
    console.log(`comparison-${startYear}-${endYear}.md updated`)
  })
}

generateComparison(2016, 2018)