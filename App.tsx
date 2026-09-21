import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { BrandSwitcher } from './src/components/BrandSwitcher';
import { BrandProvider } from './src/context/BrandContext';
import { ProductsScreen } from './src/screens/ProductsScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <BrandProvider>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <StatusBar style="auto" />
          <BrandSwitcher />
          <ProductsScreen />
        </SafeAreaView>
      </BrandProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
