import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, BackHandler, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

// Tela de Configuração da API
function ApiConfigScreen({ navigation }) {
  const [apiUrl, setApiUrl] = useState('');

  const salvarUrl = () => {
    if (apiUrl) {
      Alert.alert('URL Salva', `A URL da API foi configurada para: ${apiUrl}`);
      navigation.navigate('Home', { apiUrl });
    } else {
      Alert.alert('Erro', 'Por favor, insira uma URL válida.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurar URL da API</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite a URL da API"
        value={apiUrl}
        onChangeText={setApiUrl}
      />
      <TouchableOpacity onPress={salvarUrl} style={[styles.smallButton, { backgroundColor: '#007bff' }]}>
        <Text style={styles.buttonText}>Salvar</Text>
      </TouchableOpacity>
    </View>
  );
}

// Tela Inicial
function HomeScreen({ navigation, route }) {
  const [clickCount, setClickCount] = useState(0);
  const apiUrl = route.params?.apiUrl || 'http://172.16.102.5:5000';

  const handleTitleClick = () => {
    setClickCount((prevCount) => prevCount + 1);
    if (clickCount === 4) {
      navigation.navigate('Api');
      setClickCount(0);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handleTitleClick}>
        <Text style={styles.title}>Bem-vindo ao SG Café!</Text>
      </TouchableWithoutFeedback>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Colaborador', { apiUrl })}
          style={[styles.smallButton, { backgroundColor: '#007bff' }]}
        >
          <Text style={styles.buttonText}>Colaborador</Text>
        </TouchableOpacity>
        <View style={styles.spacing} />
        <TouchableOpacity
          onPress={() => navigation.navigate('Creditos', { uniqueId: '999999', nome: 'Visitante', apiUrl })}
          style={[styles.smallButton, { backgroundColor: '#6c757d' }]}
        >
          <Text style={styles.buttonText}>Visitante</Text>
        </TouchableOpacity>
        <Text style={styles.smallText}>Apenas para não colaboradores!</Text>
      </View>
    </View>
  );
}

function ColaboradorScreen({ navigation, route }) {
  const [uniqueId, setUniqueId] = useState('');
  const [nome, setNome] = useState('');
  const apiUrl = route.params?.apiUrl || 'http://172.16.102.5:5000';

  const handleNumericInput = (text) => {
    const numericText = text.replace(/[^0-9]/g, ''); 
    setUniqueId(numericText);
  };

  const verificarId = async () => {
    if (!uniqueId) {
      Alert.alert('Erro', 'Por favor, insira um ID válido.');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/verificar_usuario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_user: uniqueId,
          valor: 0,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setNome(data.nome);
        // Exibir uma confirmação
        Alert.alert(
          'Confirmação',
          `Você é o(a) ${data.nome}?`,
          [
            {
              text: 'Sim',
              onPress: () => navigation.navigate('Creditos', { uniqueId, nome: data.nome, apiUrl }),
            },
            {
              text: 'Não',
              onPress: () => navigation.navigate('Home'),
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('Erro', 'Usuário não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      Alert.alert('Erro', 'Não foi possível verificar o ID.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Insira seu ID</Text>

      <TextInput
        style={styles.input}
        placeholder="Digite seu ID (apenas números)"
        value={uniqueId}
        keyboardType="numeric"
        onChangeText={handleNumericInput}
      />

      <TouchableOpacity onPress={verificarId} style={[styles.evenSmallerButton, { backgroundColor: '#007bff' }]}>
        <Text style={styles.buttonText}>Verificar ID</Text>
      </TouchableOpacity>
    </View>
  );
}

function CreditosScreen({ route, navigation }) {
  const { uniqueId, nome } = route.params;
  const [credito, setCredito] = useState(0);
  const [saldo, setSaldo] = useState(null);
  const apiUrl = route.params?.apiUrl || 'http://172.16.102.5:5000';

  useEffect(() => {
    const backAction = () => true;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const adicionarCredito = (valor) => {
    setCredito((prevCredito) => (parseFloat(prevCredito) + valor).toFixed(2));
  };

  const zerarCredito = () => {
    setCredito(0);
  };

  const consultarSaldo = async () => {
    try {
      const response = await fetch(`${apiUrl}/consulta_saldo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_user: uniqueId }),
      });

      const data = await response.json();

      if (response.ok) {
        setSaldo(data.balanco);
      } else {
        Alert.alert('Erro', 'Não foi possível recuperar o saldo.');
      }
    } catch (error) {
      console.error('Erro ao consultar saldo:', error);
      Alert.alert('Erro', 'Falha na conexão com o servidor');
    }
  };

  const finalizar = async () => {
    try {
      const creditoNumerico = parseFloat(credito);

      if (isNaN(creditoNumerico) || creditoNumerico <= 0) {
        Alert.alert('Erro', 'O valor do crédito não é válido');
        return;
      }

      const response = await fetch(`${apiUrl}/cafe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_user: uniqueId,
          valor: creditoNumerico,
          nome: nome,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Sucesso', data.message);
        navigation.navigate('Home');
      } else {
        Alert.alert('Erro', data.message || 'Falha ao adicionar crédito');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão com o servidor');
      console.error('Erro na requisição:', error);
    }
    navigation.navigate('Home');
  };

  useEffect(() => {
    consultarSaldo(); 
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo (a), {nome}!</Text>
      <Text style={styles.title}>Seu Crédito: R$ {credito}</Text>
      {uniqueId !== '999999' && saldo !== null && (
        <Text style={styles.smallText}>Balanço: ({saldo})</Text>
      )}

      <View style={styles.buttonsContainer}>
        <TouchableOpacity onPress={() => adicionarCredito(1)} style={[styles.smallButton, { backgroundColor: '#007bff' }]}>
          <Text style={styles.buttonText}>Adicionar R$ 1,00</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => adicionarCredito(0.5)} style={[styles.smallButton, { backgroundColor: '#007bff' }]}>
          <Text style={styles.buttonText}>Adicionar R$ 0,50</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => adicionarCredito(0.25)} style={[styles.smallButton, { backgroundColor: '#007bff' }]}>
          <Text style={styles.buttonText}>Adicionar R$ 0,25</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={zerarCredito} style={[styles.evenSmallerButton, { backgroundColor: 'red' }]}>
          <Text style={styles.buttonText}>Zerar Crédito</Text>
        </TouchableOpacity>
        <View style={styles.spacing} />
        <TouchableOpacity onPress={finalizar} style={[styles.evenSmallerButton, { backgroundColor: 'green' }]}>
          <Text style={styles.buttonText}>Finalizar</Text>
        </TouchableOpacity>
        <View style={styles.spacing} />
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={[styles.evenSmallerButton, { backgroundColor: '#6c757d' }]}>
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// App Principal com Navegação
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Colaborador"
          component={ColaboradorScreen}
          options={{ title: 'Colaborador' }}
        />
        <Stack.Screen
          name="Creditos"
          component={CreditosScreen}
          options={{
            title: 'Selecionar Valor',
            headerLeft: null,
          }}
        />
          <Stack.Screen
          name="Api"
          component={ApiConfigScreen}
          options={{
            title: 'Configuração API',
            headerLeft: null,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  smallText: {
    fontSize: 14,
    color: '#555',
    marginTop: 0,
  },
  input: {
    width: '50%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  buttonsContainer: {
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',  
  },
  actionButtons: {
    marginTop: 15,
    width: '100%',
    alignItems: 'center',  
  },
  spacing: {
    height: 10,
  },
  smallButton: {
    width: '45%',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  evenSmallerButton: {
    width: '15%',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
