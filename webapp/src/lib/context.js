// Tầng bối cảnh môi trường: nhiệt độ lúc đá, heat-stress, độ cao.
// Suy ra từ sân (venues_climate.json) + giờ địa phương của trận.
import { VENUES_CLIMATE } from './dataLoader.js';

export function getVenueClimate(ground) {
  if (!ground) return null;
  return VENUES_CLIMATE.venues.find(v => v.match.some(s => ground.includes(s))) || null;
}

// Parse "13:00 UTC-6" → giờ địa phương (số nguyên 0-23)
function parseLocalHour(time) {
  const m = (time || '').match(/(\d{1,2}):(\d{2})\s+UTC([+-]\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function daypartOf(hour) {
  if (hour == null) return { key: 'unknown', vi: 'không rõ', tempAdj: -3 };
  if (hour < 11) return { key: 'morning', vi: 'buổi sáng', tempAdj: -3 };
  if (hour < 17) return { key: 'midday', vi: 'giữa trưa/đầu chiều', tempAdj: 0 };   // cửa sổ nóng nhất
  if (hour < 19) return { key: 'late_afternoon', vi: 'chiều muộn', tempAdj: -3 };
  return { key: 'evening', vi: 'buổi tối', tempAdj: -6 };
}

// Trả về bối cảnh môi trường của 1 trận.
export function computeMatchEnv(fixture) {
  const climate = getVenueClimate(fixture.ground);
  const hour = parseLocalHour(fixture.time);
  const daypart = daypartOf(hour);
  if (!climate) {
    return { available: false, ground: fixture.ground, kickoff_local_hour: hour, daypart: daypart.vi, notes: [] };
  }

  const cover = climate.cover; // roof | canopy | open
  const notes = [];

  // 1) Nhiệt độ cảm nhận lúc đá
  let felt;
  if (cover === 'roof') {
    felt = 22; // sân mái che/điều hòa — môi trường kiểm soát
    notes.push('Sân có mái che/điều hòa — nhiệt độ trong sân được kiểm soát (~22°C), gần như loại bỏ yếu tố nắng nóng');
  } else {
    felt = climate.temp_high_c + daypart.tempAdj;
    if (cover === 'canopy') { felt -= 2; notes.push('Sân có mái che một phần (canopy) tạo bóng râm, giảm nhẹ tác động nhiệt'); }
    // Hiệu chỉnh độ ẩm khi nóng
    if (felt >= 26 && climate.humidity >= 55) felt += Math.round((climate.humidity - 50) / 12);
  }
  felt = Math.round(felt);

  // 2) Phân mức heat-stress
  let heat_stress, heat_note;
  if (cover === 'roof')      { heat_stress = 'Thấp';        heat_note = 'môi trường kiểm soát'; }
  else if (felt < 26)        { heat_stress = 'Thấp';        heat_note = 'mát, ít ảnh hưởng thể lực'; }
  else if (felt < 31)        { heat_stress = 'Trung bình';  heat_note = 'ấm, ảnh hưởng nhẹ về cuối trận'; }
  else if (felt < 35)        { heat_stress = 'Cao';         heat_note = 'nóng, bào mòn thể lực, lợi cho đội đá chậm/kiểm soát'; }
  else                       { heat_stress = 'Khắc nghiệt'; heat_note = 'rất nóng, nguy cơ kiệt sức, giảm cường độ pressing'; }

  if (cover !== 'roof' && felt >= 31)
    notes.push(`Nhiệt độ ước tính lúc bóng lăn ~${felt}°C (${daypart.vi}) — heat-stress ${heat_stress.toLowerCase()}, ${heat_note}`);
  else if (cover !== 'roof')
    notes.push(`Nhiệt độ ước tính lúc bóng lăn ~${felt}°C (${daypart.vi}) — ${heat_note}`);

  // 3) Độ cao
  let altitude_level = 'Thấp';
  if (climate.altitude_m >= 2000) {
    altitude_level = 'Rất cao';
    notes.push(`Độ cao ${climate.altitude_m}m — ảnh hưởng MẠNH tới thể lực/hô hấp, lợi rõ cho đội quen độ cao, đối thủ dễ đuối hiệp 2`);
  } else if (climate.altitude_m >= 1200) {
    altitude_level = 'Cao';
    notes.push(`Độ cao ${climate.altitude_m}m — ảnh hưởng đáng kể tới thể lực, đội khách cần thích nghi`);
  }

  return {
    available: true,
    city: climate.city,
    ground: fixture.ground,
    kickoff_local_hour: hour,
    daypart: daypart.vi,
    cover,
    temp_felt_c: felt,
    humidity: climate.humidity,
    altitude_m: climate.altitude_m,
    altitude_level,
    heat_stress,
    notes,
  };
}
