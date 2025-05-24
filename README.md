# react-native-english-to-ipa

This package utilizes the Carnegie-Mellon University Pronouncing Dictionary to convert English text into the [International Phonetic Alphabet](https://en.wikipedia.org/wiki/International_Phonetic_Alphabet).

## Installation

```sh
npm install react-native-english-to-ipa
```

## Usage


```js
import { covert } from 'react-native-english-to-ipa';

// ...

const result = covert('One is loved because one is loved. No reason is needed for loving.');
// wʌn ɪz lʌvd bɪˈkɔz wʌn ɪz lʌvd. noʊ ˈrizən ɪz ˈnidəd fɔr ˈlʌvɪŋ.
```


## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
