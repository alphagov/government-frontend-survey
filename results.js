const fs = require('fs')

const data2016 = require('./data/2016.json')

const responses =
  data2016
    .map(response => {
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

const overallTotalResponses = 
  responses
    // Get the first question, which should only have single answers.
    .filter(response => response.id === 1)
    .map(response => response.total)
    [0]


let output = `# Government Frontend Survey Results

## 2016
`

responses.forEach(response => {
  const formattedAnswers =
    Object
      .entries(response.answers)
      .sort((a, b) => {
        const valueA = a[1]
        const valueB = b[1]
        return valueA < valueB
      })
      .map(answer => {
        const key = answer[0]
        const value = answer[1]
        const percentage = ((value / response.total) * 100).toFixed(1)
        return `| ${key} | ${value} | ${percentage}% |`
      }).join('\n')

  output += (

`
### Question ${response.id}: ${response.question}

#### Answers

| Name | Count | Percentage |
| --- | --- | --- |
${formattedAnswers}
`
    
  )
})

fs.writeFile('./results.md', output, (error) => {
  if (error) {
    return console.log(err)
  }
  console.log('results.md updated')
})