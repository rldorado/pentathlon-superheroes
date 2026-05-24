import { describe, it, expect } from 'vitest'
import { validateName, validateAttribute, validateAttributes, validatePicture } from './validators'

describe('validateName', () => {
  const notTaken = { isTaken: () => false }
  const taken = { isTaken: () => true }

  it('rejects empty / whitespace-only / too-short / too-long', () => {
    expect(validateName('', notTaken)).toMatch(/obligatorio/)
    expect(validateName('   ', notTaken)).toMatch(/obligatorio/)
    expect(validateName('A', notTaken)).toMatch(/al menos 2/)
    expect(validateName('a'.repeat(41), notTaken)).toMatch(/40 caracteres/)
  })

  it('accepts Spanish names with accents, ñ, dots, apostrophes, hyphens', () => {
    expect(validateName('Capitán Fuerza', notTaken)).toBeNull()
    expect(validateName('La Niña', notTaken)).toBeNull()
    expect(validateName("D'Artagnan", notTaken)).toBeNull()
    expect(validateName('Spider-Man', notTaken)).toBeNull()
    expect(validateName('J.A.R.V.I.S.', notTaken)).toBeNull()
    expect(validateName('Héroe 42', notTaken)).toBeNull()
  })

  it('rejects emojis and control characters', () => {
    expect(validateName('Capitán 🦸', notTaken)).toMatch(/Solo se permiten/)
    expect(validateName('A\nB', notTaken)).toMatch(/Solo se permiten/)
    expect(validateName('A\tB', notTaken)).toMatch(/Solo se permiten/)
  })

  it('rejects punctuation outside the allowed set', () => {
    expect(validateName('Hero/Villain', notTaken)).toMatch(/Solo se permiten/)
    expect(validateName('Hero@home', notTaken)).toMatch(/Solo se permiten/)
    expect(validateName('Hero!', notTaken)).toMatch(/Solo se permiten/)
  })

  it('flags duplicate names via the isTaken callback', () => {
    expect(validateName('La Sombra', taken)).toMatch(/Ya existe/)
  })

  it('trims before length checks', () => {
    expect(validateName('   AB   ', notTaken)).toBeNull()
    expect(validateName('  A  ', notTaken)).toMatch(/al menos 2/)
  })
})

describe('validateAttribute', () => {
  it('accepts integers in [0, 10]', () => {
    for (let v = 0; v <= 10; v++) expect(validateAttribute(v)).toBeNull()
  })

  it('rejects out-of-range integers, fractions, NaN, strings, booleans', () => {
    expect(validateAttribute(-1)).toMatch(/entre 0 y 10/)
    expect(validateAttribute(11)).toMatch(/entre 0 y 10/)
    expect(validateAttribute(5.5)).toMatch(/entre 0 y 10/)
    expect(validateAttribute(Number.NaN)).toMatch(/entre 0 y 10/)
    expect(validateAttribute('5')).toMatch(/entre 0 y 10/)
    expect(validateAttribute(true)).toMatch(/entre 0 y 10/)
    expect(validateAttribute(null)).toMatch(/entre 0 y 10/)
  })
})

describe('validateAttributes', () => {
  it('returns an empty object when all 5 attributes are valid', () => {
    expect(
      validateAttributes({ agility: 5, strength: 5, weight: 5, endurance: 5, charisma: 5 }),
    ).toEqual({})
  })

  it('reports each offending attribute by key', () => {
    const out = validateAttributes({
      agility: 5,
      strength: -1,
      weight: 11,
      endurance: 5.5,
      charisma: 5,
    })
    expect(out).toHaveProperty('strength')
    expect(out).toHaveProperty('weight')
    expect(out).toHaveProperty('endurance')
    expect(out).not.toHaveProperty('agility')
    expect(out).not.toHaveProperty('charisma')
  })
})

describe('validatePicture', () => {
  it('create mode: requires a picture', () => {
    expect(validatePicture(undefined, 'create')).toMatch(/obligatoria/)
    expect(validatePicture('', 'create')).toMatch(/obligatoria/)
    expect(validatePicture('iVBORfake', 'create')).toBeNull()
  })

  it('edit mode: picture is optional (keep existing)', () => {
    expect(validatePicture(undefined, 'edit')).toBeNull()
    expect(validatePicture('iVBORfake', 'edit')).toBeNull()
  })
})
