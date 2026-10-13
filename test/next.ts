/** `redirect`, as the mocks in `setup.ts` throw it: a test sees where it went. */
export class Redirected extends Error {
  constructor(readonly to: string) {
    super(`redirect ${to}`);
  }
}
