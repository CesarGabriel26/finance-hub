import { Ofx, NormalizedOfxData } from 'ofx-data-extractor';

/**
 * Reads and parses an OFX bank statement file content (either a Blob/File or raw string)
 * and returns the normalized JSON representation.
 */
export async function readOfx(fileContent: Blob | string): Promise<NormalizedOfxData> {
  let ofxInstance: Ofx;

  if (typeof fileContent === 'string') {
    ofxInstance = new Ofx(fileContent);
  } else if (fileContent instanceof Blob) {
    ofxInstance = await Ofx.fromBlob(fileContent);
  } else {
    throw new Error('Unsupported OFX file input type. Must be a Blob, File, or string.');
  }

  return ofxInstance.toNormalized() as NormalizedOfxData;
}
