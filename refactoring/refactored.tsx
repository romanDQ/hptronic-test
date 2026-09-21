import { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Only the fields the UI reads. DummyJSON also returns password and bank data.
type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

type UserProfileProps = {
  userId: number;
  onUserFetched?: (user: User) => void;
};

// Exclusive states so loading + error cannot both be true.
type UserState =
  | { status: 'loading' }
  | { status: 'success'; user: User }
  | { status: 'error'; message: string };

async function fetchUser(
  userId: number,
  signal: AbortSignal,
): Promise<User> {
  const response = await fetch(
    `https://dummyjson.com/users/${userId}`,
    { signal },
  );

  // DummyJSON 404s with a JSON body — check status before treating it as a user.
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? `User ${userId} could not be found.`
        : `Failed to fetch user (${response.status})`,
    );
  }

  const data: unknown = await response.json();

  if (!isUser(data)) {
    throw new Error('Unexpected response format.');
  }

  return data;
}

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user.id === 'number' &&
    typeof user.firstName === 'string' &&
    typeof user.lastName === 'string' &&
    typeof user.email === 'string'
  );
}

function useUser(
  userId: number,
  onUserFetched?: (user: User) => void,
) {
  const [state, setState] = useState<UserState>({
    status: 'loading',
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // Ref so an inline parent callback does not retrigger the fetch effect.
  const onUserFetchedRef = useRef(onUserFetched);
  onUserFetchedRef.current = onUserFetched;

  useEffect(() => {
    const controller = new AbortController();

    setState({ status: 'loading' });

    async function loadUser() {
      try {
        const user = await fetchUser(
          userId,
          controller.signal,
        );

        if (controller.signal.aborted) {
          return;
        }

        setState({ status: 'success', user });
        onUserFetchedRef.current?.(user);
      } catch (error: unknown) {
        // Abort is cleanup (unmount / userId change / refresh), not a UI error.
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to load user.',
        });
      }
    }

    void loadUser();

    return () => controller.abort();
  }, [userId, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return {
    state,
    refresh,
  };
}

export default function UserProfile({
  userId,
  onUserFetched,
}: UserProfileProps) {
  const { state, refresh } = useUser(
    userId,
    onUserFetched,
  );

  return (
    <View style={styles.container}>
      {state.status === 'loading' && (
        <Text>Loading user...</Text>
      )}

      {state.status === 'error' && (
        <Text style={styles.error}>{state.message}</Text>
      )}

      {state.status === 'success' && (
        <View>
          <Text style={styles.heading}>User Details:</Text>
          <Text>
            Name: {state.user.firstName} {state.user.lastName}
          </Text>
          <Text>Email: {state.user.email}</Text>
        </View>
      )}

      <TouchableOpacity
        onPress={refresh}
        style={styles.button}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Refresh User</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  heading: {
    fontWeight: 'bold',
  },
  error: {
    marginBottom: 8,
    color: '#b00020',
  },
  button: {
    marginTop: 10,
    backgroundColor: 'blue',
    padding: 10,
  },
  buttonText: {
    color: 'white',
  },
});
