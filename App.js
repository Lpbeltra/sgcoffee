import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Alert, BackHandler } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

// Tela de Login
function LoginScreen({ navigation }) {
  const [uniqueId, setUniqueId] = useState('');
  const [senha, setSenha] = useState('');

  // Função para garantir que apenas números sejam aceitos
  const handleNumericInput = (text, setState) => {
    const numericText = text.replace(/[^0-9]/g, ''); // Remove caracteres não numéricos
    setState(numericText);
  };

  const handleLogin = async () => {
    if (!uniqueId || !senha) {
      Alert.alert('Erro', 'ID e senha são obrigatórios!');
      return;
    }

    try {
      const requestBody = {
        unique_id: Number(uniqueId), // Certifique-se de que uniqueId seja um número
        senha: senha,  // Senha como string
      };

      console.log('Enviando para API:', requestBody); // Log para debug

      const response = await fetch('http://10.0.2.2:5000/verificar_login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Resposta da API:', data); // Log para debug

      if (response.ok && data.autenticado) {
        // Envia o uniqueId e senha para a tela de créditos
        navigation.navigate('Creditos', { uniqueId, senha });
      } else {
        Alert.alert('Erro', data.message || 'Login falhou');
      }
    } catch (error) {
      console.log('Erro ao conectar à API:', error);
      Alert.alert('Erro', 'Falha na conexão com o servidor');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tela de Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Digite seu ID (apenas números)"
        value={uniqueId}
        keyboardType="numeric"
        onChangeText={(text) => handleNumericInput(text, setUniqueId)} // Filtra apenas números
      />

      <TextInput
        style={styles.input}
        placeholder="Digite sua senha"
        value={senha}
        secureTextEntry
        onChangeText={(text) => setSenha(text)}  // Agora, aceitando qualquer string para a senha
      />

      <Button title="Entrar" onPress={handleLogin} />
    </View>
  );
}


// Tela de Créditos
function CreditosScreen({ route, navigation }) {
  const { uniqueId, senha } = route.params;  // Agora 'uniqueId' vem corretamente da tela de login
  const [credito, setCredito] = useState(0);

  useEffect(() => {
    const backAction = () => {
      return true; // Impede a navegação para a tela anterior
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove(); // Limpa o evento ao sair da tela
  }, []);

  const adicionarCredito = (valor) => {
    setCredito((prevCredito) => {
      const novoCredito = parseFloat(prevCredito) + valor;
      return novoCredito.toFixed(2);
    });
  };

  const zerarCredito = () => {
    setCredito(0);
  };

  const cancelar = () => {
    navigation.navigate('Login');
  };

  const finalizar = async () => {
    try {
      const creditoNumerico = parseFloat(credito);  // Garantir que o crédito é um número

      if (isNaN(creditoNumerico) || creditoNumerico <= 0) {
        Alert.alert('Erro', 'O valor do crédito não é válido');
        return;
      }

      // Verifica se o nome e a senha estão definidos
      if (!uniqueId || !senha) {
        Alert.alert('Erro', 'Nome e senha são obrigatórios');
        return;
      }

      console.log('Enviando dados:', { uniqueId, senha, valor: creditoNumerico });

      const response = await fetch('http://10.0.2.2:5000/adicionar_credito', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unique_id: uniqueId,  // Passando uniqueId corretamente
          senha: senha,  // Senha do usuário
          valor: creditoNumerico,  // Valor do crédito
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Sucesso', data.message);
        navigation.navigate('Login');  // Volta para a tela de login
      } else {
        Alert.alert('Erro', data.message || 'Falha ao adicionar crédito');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão com o servidor');
      console.error('Erro na requisição:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seu Crédito: R$ {credito}</Text>

      <View style={styles.buttonsContainer}>
        <Button title="Adicionar R$ 1,00" onPress={() => adicionarCredito(1)} />
        <Button title="Adicionar R$ 0,50" onPress={() => adicionarCredito(0.5)} />
        <Button title="Adicionar R$ 0,25" onPress={() => adicionarCredito(0.25)} />
      </View>

      <View style={styles.actionButtons}>
        <Button title="Zerar Crédito" onPress={zerarCredito} color="red" />
        <View style={styles.spacing} />
        <Button title="Finalizar" onPress={finalizar} color="green" />
        <View style={styles.spacing} />
        <Button title="Cancelar" onPress={cancelar} color="gray" />
      </View>
    </View>
  );
}

// App Principal com Navegação
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}          
          options={{
            headerLeft: null, // Remove o botão de voltar
          }}
        />
        <Stack.Screen
          name="Creditos"
          component={CreditosScreen}
          options={{
            headerLeft: null, // Remove o botão de voltar
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
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  buttonsContainer: {
    marginVertical: 20,
    width: '100%',
  },
  actionButtons: {
    marginTop: 30,
    width: '100%',
  },
  spacing: {
    height: 10,
  },
});
