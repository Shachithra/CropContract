export const SRI_LANKA_PROVINCES = [
  { province: 'Western', districts: ['Colombo', 'Gampaha', 'Kalutara'] },
  { province: 'Central', districts: ['Kandy', 'Matale', 'Nuwara Eliya'] },
  { province: 'Southern', districts: ['Galle', 'Matara', 'Hambantota'] },
  { province: 'Northern', districts: ['Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu'] },
  { province: 'Eastern', districts: ['Trincomalee', 'Batticaloa', 'Ampara'] },
  { province: 'North Western', districts: ['Kurunegala', 'Puttalam'] },
  { province: 'North Central', districts: ['Anuradhapura', 'Polonnaruwa'] },
  { province: 'Uva', districts: ['Badulla', 'Monaragala'] },
  { province: 'Sabaragamuwa', districts: ['Ratnapura', 'Kegalle'] },
]

export const SRI_LANKA_DISTRICTS = SRI_LANKA_PROVINCES.flatMap((p) => p.districts)

export function provinceForDistrict(district) {
  return SRI_LANKA_PROVINCES.find((p) => p.districts.includes(district))?.province || ''
}
