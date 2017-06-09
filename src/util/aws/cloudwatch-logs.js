import AWS from './'

export async function getLogGroup ({ functionName }) {
  const cwLogs = new AWS.CloudWatchLogs()
  const expetedName = `/aws/lambda/${functionName}`

  const params = {
    logGroupNamePrefix: expetedName
  }

  try {
    const groups = await cwLogs.describeLogGroups(params).promise().get('logGroups')
    const matchedGroups = groups.filter((logGroup) => logGroup.logGroupName === expetedName)
    return matchedGroups.get(0).get('logGroupName')
  } catch (e) {
    throw new Error('No log groups found for specified function')
  }
}

export async function getLogStreams ({ logGroupName, functionVersion }) {
  const cwLogs = new AWS.CloudWatchLogs()
  const versionRegExp = new RegExp(`\\[${functionVersion}\\]`)

  // LastEventTime isn't always accurate
  const params = {
    logGroupName,
    orderBy: 'LastEventTime',
    descending: true
  }

  const logStreams = await cwLogs.describeLogStreams(params).promise().get('logStreams')
  const matchedStreams = logStreams.filter((stream) => versionRegExp.test(stream.logStreamName))
  return matchedStreams.map((x) => x.logStreamName)
}

export function getLogEvents ({ logGroupName, logStreamNames, start, end }) {
  const cwLogs = new AWS.CloudWatchLogs()

  const params = {
    logGroupName,
    logStreamNames,
    startTime: start,
    endTime: end,
    interleaved: true
  }

  return cwLogs.filterLogEvents(params).promise()
  .get('events')
}
