import { Text, View, StyleSheet } from 'react-native';
import { convert } from 'react-native-english-to-ipa';

const result = convert('One is loved because one is loved. No reason is needed for loving.');
console.log(result);

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Result: {result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
