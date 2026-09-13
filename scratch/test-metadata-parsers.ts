import * as cheerio from 'cheerio';
import { cdnAgent } from '../apps/backend/jobs/extract-detected-item-content';

function parseDateStringToIso(raw: string): string | undefined {
  if (!raw) return undefined;
  const match = raw.trim().match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (!match) return undefined;
  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const year = match[3];
  return `${year}-${month}-${day}`;
}

function parseCongBaoMetadata(html: string) {
  const $ = cheerio.load(html);
  let documentNumber: string | undefined;
  let documentType: string | undefined;
  let issuingBody: string | undefined;
  let issuedDate: string | undefined;
  let effectiveDate: string | undefined;

  $('.document--focus .row, .table .row').each((_, el) => {
    const name = $(el).find('.name').text().trim().toLowerCase();
    const val = $(el).find('.value').text().trim();
    if (!val) return;

    if (name.includes('số') && name.includes('ký hiệu')) {
      documentNumber = val;
    } else if (name.includes('loại văn bản')) {
      documentType = val;
    } else if (name.includes('cơ quan ban hành')) {
      issuingBody = val;
    } else if (name.includes('ngày ban hành')) {
      issuedDate = parseDateStringToIso(val);
    } else if (name.includes('ngày hiệu lực')) {
      effectiveDate = parseDateStringToIso(val);
    }
  });

  return { documentNumber, documentType, issuingBody, issuedDate, effectiveDate };
}

function parseVanBanMetadata(html: string) {
  const $ = cheerio.load(html);
  let documentNumber: string | undefined;
  let documentType: string | undefined;
  let issuingBody: string | undefined;
  let issuedDate: string | undefined;
  let effectiveDate: string | undefined;

  $('table tr').each((_, el) => {
    const tds = $(el).find('td');
    if (tds.length < 2) return;

    const label = $(tds[0]).text().trim().toLowerCase();
    const val = $(tds[1]).text().trim();
    if (!val) return;

    if (label.includes('số ký hiệu')) {
      documentNumber = val;
    } else if (label.includes('loại văn bản')) {
      documentType = val;
    } else if (label.includes('cơ quan ban hành')) {
      issuingBody = val;
    } else if (label.includes('ngày ban hành')) {
      issuedDate = parseDateStringToIso(val);
    } else if (label.includes('ngày có hiệu lực') || label.includes('ngày hiệu lực')) {
      effectiveDate = parseDateStringToIso(val);
    }
  });

  return { documentNumber, documentType, issuingBody, issuedDate, effectiveDate };
}

async function testBoth() {
  console.log('=== TEST CONGBAO METADATA PARSER (28/2026) ===');
  const cbRes = await fetch('https://congbao.chinhphu.vn/van-ban/van-ban-hop-nhat-so-28-2026-vbhn-tt-btc-470421.htm', { dispatcher: cdnAgent as any });
  const cbHtml = await cbRes.text();
  console.log(parseCongBaoMetadata(cbHtml));

  console.log('\n=== TEST VANBAN METADATA PARSER (43/2026) ===');
  const vbRes = await fetch('https://vanban.chinhphu.vn/?pageid=27160&docid=219330', { dispatcher: cdnAgent as any });
  const vbHtml = await vbRes.text();
  console.log(parseVanBanMetadata(vbHtml));
}

testBoth();
