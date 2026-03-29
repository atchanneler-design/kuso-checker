import satori from 'satori';
import { html } from 'satori-html';

const markup = html\`
  <div style="display: flex; width: 1200px; height: 630px">
    <div style="display: flex; position: relative">
      <svg></svg>
      <div style="position: absolute">
        <div>A</div>
        <div>B</div>
      </div>
    </div>
  </div>
\`;

satori(markup, { width: 1200, height: 630, fonts: [{ name: 'Test', data: new Uint8Array(1), weight: 400, style: 'normal' }] })
  .catch(e => console.log('ERROR IS', e.message));
