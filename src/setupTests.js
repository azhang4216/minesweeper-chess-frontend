// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// React Router v7 requires TextEncoder/TextDecoder which CRA's jsdom doesn't include.
// The moduleNameMapper in package.json is also required: react-router-dom v7's package.json
// has "main": "./dist/main.js" but that file doesn't exist. Jest 27 (bundled with CRA) can't
// use the "exports" field, so we manually point Jest to the real entry at dist/index.js.
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
