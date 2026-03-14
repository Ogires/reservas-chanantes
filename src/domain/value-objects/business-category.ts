export const BUSINESS_CATEGORIES = [
  'LocalBusiness',
  'HairSalon',
  'BeautySalon',
  'DaySpa',
  'HealthAndBeautyBusiness',
  'TattooParlor',
  'Dentist',
  'Physician',
  'MedicalBusiness',
  'ProfessionalService',
  'LegalService',
  'FinancialService',
  'AutomotiveBusiness',
  'FitnessCenter',
  'SportsActivityLocation',
  'EntertainmentBusiness',
  'FoodEstablishment',
  'Veterinarian',
] as const

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number]

import type { Locale } from '@/domain/types'

const CATEGORY_LABELS_MAP: Record<Locale, Record<BusinessCategory, string>> = {
  'en-US': {
    LocalBusiness: 'Other / General',
    HairSalon: 'Hair Salon',
    BeautySalon: 'Beauty Salon',
    DaySpa: 'Day Spa',
    HealthAndBeautyBusiness: 'Health & Beauty',
    TattooParlor: 'Tattoo Parlor',
    Dentist: 'Dentist',
    Physician: 'Physician',
    MedicalBusiness: 'Medical Practice',
    ProfessionalService: 'Professional Service',
    LegalService: 'Legal Service',
    FinancialService: 'Financial Service',
    AutomotiveBusiness: 'Automotive',
    FitnessCenter: 'Fitness Center',
    SportsActivityLocation: 'Sports & Activities',
    EntertainmentBusiness: 'Entertainment',
    FoodEstablishment: 'Restaurant / Cafe',
    Veterinarian: 'Veterinarian',
  },
  'es-ES': {
    LocalBusiness: 'Otro / General',
    HairSalon: 'Peluqueria',
    BeautySalon: 'Salon de belleza',
    DaySpa: 'Spa',
    HealthAndBeautyBusiness: 'Salud y belleza',
    TattooParlor: 'Estudio de tatuajes',
    Dentist: 'Dentista',
    Physician: 'Medico',
    MedicalBusiness: 'Clinica',
    ProfessionalService: 'Servicio profesional',
    LegalService: 'Servicio legal',
    FinancialService: 'Servicio financiero',
    AutomotiveBusiness: 'Automocion',
    FitnessCenter: 'Centro de fitness',
    SportsActivityLocation: 'Deportes y actividades',
    EntertainmentBusiness: 'Entretenimiento',
    FoodEstablishment: 'Restaurante / Cafeteria',
    Veterinarian: 'Veterinario',
  },
}

/** @deprecated Use getCategoryLabels(locale) instead */
export const CATEGORY_LABELS: Record<BusinessCategory, string> = CATEGORY_LABELS_MAP['en-US']

export function getCategoryLabels(locale: Locale): Record<BusinessCategory, string> {
  return CATEGORY_LABELS_MAP[locale]
}
