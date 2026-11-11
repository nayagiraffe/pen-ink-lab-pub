// 테스트용 가상 컬렉션 (실제 개인 데이터가 아님)
const pen = (id, brand, name, nib, extra = {}) => ({ id, brand, name, nib, inkBrand: '', inkName: '—', status: '미잉입', notes: '', fillVerified: false, ...extra });
const ink = (id, brand, name, family, hue, effect = 'Standard', extra = {}) => ({ id, brand, name, family, hue, value: '중간', saturation: '중간', effect, flow: '', notes: '', packageType: 'bottle', ...extra });

const pens = [
  pen('p1', 'Lamy', 'Safari', 'F'),
  pen('p2', 'Pilot', 'Custom 74', 'M'),
  pen('p3', 'Platinum', 'Preppy', 'EF'),
  pen('p4', 'Pilot', 'Kakuno', 'F', { inkBrand: 'Diamine', inkName: 'Marine', status: '현재 잉입', fillVerified: true }),
  pen('p5', 'Sailor', 'Pro Gear Slim', 'M', { companionInks: ['i16'] }),
  pen('p6', 'TWSBI', 'Eco Blue', 'B'),
];
const inks = [
  ink('i1', 'Diamine', 'Oxblood', '레드', 'red'),
  ink('i2', 'Diamine', 'Marine', '블루', 'blue'),
  ink('i3', 'Diamine', 'Sherwood Green', '그린', 'green'),
  ink('i4', 'Diamine', 'Ancient Copper', '브라운', 'brown', 'Sheen'),
  ink('i5', 'Diamine', 'Majestic Blue', '블루', 'blue', 'Shading'),
  ink('i6', 'Diamine', 'Imperial Purple', '퍼플', 'purple'),
  ink('i7', 'Pilot', 'Iroshizuku Kon-peki', '블루', 'blue'),
  ink('i8', 'Pilot', 'Iroshizuku Shin-kai', '블루', 'navy', 'Shading'),
  ink('i9', 'Pilot', 'Iroshizuku Tsukushi', '그린', 'green'),
  ink('i10', 'Sailor', 'Jentle Blue Black', '블루', 'blue'),
  ink('i11', 'Sailor', 'Jentle Yama-dori', '그린', 'green'),
  ink('i12', 'Montblanc', 'Royal Blue', '블루', 'blue'),
  ink('i13', 'Montblanc', 'Permanent Black', '블랙', 'black'),
  ink('i14', 'J. Herbin', '1670 Rouge Hematite', '레드', 'red', 'Shimmer'),
  ink('i15', 'J. Herbin', 'Vert Olive', '그린', 'olive'),
  ink('i16', 'Sailor', 'Special Pearl Pink', '퍼플 & 핑크', 'pink', 'Shimmer'),
  ink('i17', 'Rohrer & Klingner', 'Salix', '블랙', 'black'),
  ink('i18', 'Kaweco', 'Palm Green', '그린', 'green', 'Standard', { packageType: 'sample' }),
];
module.exports = { pens, inks, base: { pens, inks } };
