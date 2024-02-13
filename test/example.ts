import { CompareResult, sortTopN } from '../src/core'

// example dating profile
type Profile = {
  major: string
  minor: string | null
  yearOfEntry: number
  height: number | null
  weight: number | null
  district: string
  university: string
}

type CompareRecord = {
  chosen: Profile
  not_chosen: Profile
}

function getCandidates() {
  try {
    let topN = 3
    let profiles: Profile[] = loadProfiles()
    let topNCandidates: Profile[] = sortTopN(compareProfile, topN, profiles)
    return {
      type: 'matched',
      topNCandidates,
    }
  } catch (error) {
    if (error instanceof NotCompared) {
      let { a, b } = error
      return {
        type: 'compare',
        profiles: [a, b],
      }
    }
    return {
      type: 'error',
      message: String(error),
    }
  }
}

function compareProfile(a: Profile, b: Profile): CompareResult<Profile> {
  let record: CompareRecord | null = findCompareRecord(a, b)
  if (!record) {
    // ask user to perform comparison
    throw new NotCompared(a, b)
  }
  return {
    small: record.not_chosen,
    large: record.chosen,
  }
}

class NotCompared extends Error {
  constructor(
    public a: Profile,
    public b: Profile,
  ) {
    super('not compared')
  }
}

// load from database
function loadProfiles(): Profile[] {
  return []
}

// load from database
function findCompareRecord(a: Profile, b: Profile): CompareRecord | null {
  return null
}
