import { Navigate } from 'react-router-dom';
import { ActivityIndicator, View } from 'react-native-web';
import { useAuth } from '@src/context/AuthContext';
import { colors } from '@src/theme';

/** `/` decides where a visitor belongs based on how far they have got. */
export default function IndexRedirect() {
  const { isAuthenticated, hasSeenOnboarding, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, minHeight: 240, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.brand.primary} />
      </View>
    );
  }
  if (isAuthenticated) return <Navigate to="/home" replace />;
  if (hasSeenOnboarding) return <Navigate to="/login" replace />;
  return <Navigate to="/onboarding" replace />;
}
