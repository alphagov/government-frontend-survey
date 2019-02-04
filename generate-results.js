const fs = require('fs')
const outdent = require('outdent')

function generateResults (year) {
  const data = require(`./data/${year}.json`)

  const responses =
    data
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
  
  
  let output = outdent`
    # Government Frontend Survey Results

    ## ${year}

  `
  
  responses.forEach(response => {
    if (response.type === 'open') {
      const formattedAnswers =
        Object
          .entries(response.answers)
          .map(answer => {
            const key = answer[0]
            const value = answer[1]
            let formattedValue = ''
            if (typeof value !== 'boolean' && value) {
              formattedValue = '\n' + value.map(v => `  - ${v}`).join('\n')
            }
            return outdent`
              - ${key}${formattedValue}
            `
          }).join('\n')

      output += outdent`

        ### Question ${response.id}: ${response.question}

        #### Answers

        ${formattedAnswers}
      `
    } else {
      const formattedAnswers =
        Object
          .entries(response.answers)
          .sort((a, b) => {
            const valueA = a[1]
            const valueB = b[1]
            if (valueA < valueB) {
              return 1
            } else {
              return -1
            }
          })
          .map(answer => {
            const key = answer[0]
            const value = answer[1]
            const percentage = ((value / response.total) * 100).toFixed(1)
            return `| ${key} | ${value} | ${percentage}% |`
          }).join('\n')
      output += outdent`

        ### Question ${response.id}: ${response.question}

        #### Answers

        | Name | Count | Percentage |
        | --- | --- | --- |
        ${formattedAnswers}
      `
    }
  })
  
  fs.writeFile(`./results-${year}.md`, output, (error) => {
    if (error) {
      return console.log(err)
    }
    console.log(`results-${year}.md updated`)
  })
}

generateResults('2016')
generateResults('2018')