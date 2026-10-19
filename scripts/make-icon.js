// Gera build/icon.ico e src/icon.png a partir do monograma C&K usado no sistema.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#111827"/>
  <text x="140" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="250" fill="#c9a45c">C</text>
  <text x="245" y="390" font-family="Georgia, 'Times New Roman', serif" font-size="230" fill="#e8d3a0">K</text>
</svg>`;

(async () => {
  const root = path.join(__dirname, '..');
  fs.mkdirSync(path.join(root, 'build'), { recursive: true });
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngs = await Promise.all(sizes.map(s => sharp(Buffer.from(svg)).resize(s, s).png().toBuffer()));
  fs.writeFileSync(path.join(root, 'build', 'icon.ico'), await pngToIco(pngs));
  await sharp(Buffer.from(svg)).resize(512, 512).png().toFile(path.join(root, 'build', 'icon.png'));
  await sharp(Buffer.from(svg)).resize(256, 256).png().toFile(path.join(root, 'src', 'icon.png'));
  console.log('Ícones gerados.');
})();
