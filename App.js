import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, BackHandler, TouchableOpacity, TouchableWithoutFeedback, Switch, Modal  } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AutoCompleteInput from './input';
import TextModal from "./textModal";

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
				style={[styles.smallButtonIniciar, { backgroundColor: '#228B22' }]}
			>
				<Text style={styles.buttonTextIniciar}>Iniciar!</Text>
			</TouchableOpacity>
			<View style={styles.spacing} />
			</View>
		</View>
	);
}

function ColaboradorScreen({ navigation, route }) {
	const [uniqueId, setUniqueId] = useState('');
	const [nome, setNome] = useState('');
	const apiUrl = route.params?.apiUrl || 'http://172.16.102.5:5000';
	const [isEnabled, setIsEnabled] = useState(false);
	const toggleSwitch = () => {
		setIsEnabled(previousState => !previousState)
		checkInput()
		setNome('')
		setUniqueId('')
	};
	
	const checkInput = () => {
		if (!isEnabled) {
			return 'Digite seu ID'
		} else {
			return 'Digite seu nome'
		}
	}
	
	const handleNumericInput = (text) => {
		const numericText = text.replace(/[^0-9]/g, ''); 
		setUniqueId(numericText);
	};
	
	const handleTextInput = (text) => { 
		console.log(text);
		setNome(text);
		verificarLista(text);
	};
	
	const verificarId = async () => {
		if (!uniqueId) {
			Alert.alert('Erro', 'Por favor, insira um ID válido.');
			return;
		}
		
		try {
			const response = await fetch(`${apiUrl}/verificar_login`, {
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

	const verificarNome = async () => {
		
		if (!nome) {
			Alert.alert('Erro', 'Por favor, insira um nome válido.');
			return;
		}
		
		try {
			const response = await fetch(`${apiUrl}/verificar_login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nome: nome,
				}),
			});

			const data = await response.json();

			if (response.ok && data.success) {
				
				Alert.alert(
					'Confirmação',
					`Você é o(a) ${data.data[0].nome}?`,
					[
						{
							text: 'Sim',
							onPress: () => navigation.navigate('Creditos', { uniqueId: data.data[0].fkIdVendedor, nome: data.data[0].nome, apiUrl }),
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

	const verificarLista = async (text) => {
    try {
				const response = await fetch(`${apiUrl}/listar_usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: text }),
        });
        const data = await response.json();

        if (response.ok && data.success) {
            return data.data; 
        } 
        return [];
				} catch (error) {
						console.log('Erro ao listar usuários', error);
						return [];
				}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{}</Text>
			{ !isEnabled ? (
				<TextInput
					style={styles.input}
					placeholder={checkInput()}
					value={uniqueId}
					keyboardType="numeric"
					onChangeText={handleNumericInput}
				/>
			) : (
				<AutoCompleteInput 
				handleTextInput={verificarLista}
				onChangeValue={handleTextInput}
				setNome={setNome} 
				nome={nome}
				/>
			)}
	
			<Switch
				trackColor={{ false: '#767577', true: '#81b0ff' }}
				thumbColor={isEnabled ? '#4771ed' : '#0744fa'}
				ios_backgroundColor="#3e3e3e"
				onValueChange={toggleSwitch}
				value={isEnabled}
				style={styles.switchInput}
			/>
			{ !isEnabled ? (
				<TouchableOpacity onPress={verificarId} style={[styles.evenSmallerButton, { backgroundColor: '#007bff' }]}>
					<Text style={styles.buttonText}>Verificar ID</Text>
				</TouchableOpacity>
			) : (
				<TouchableOpacity onPress={verificarNome} style={[styles.evenSmallerButton, { backgroundColor: '#007bff' }]}>
					<Text style={styles.buttonText}>Verificar nome</Text>
				</TouchableOpacity>
			)}
		</View>
	);
	
}
	
	function CreditosScreen({ route, navigation }) {
		const [textoVisita, setTextoVisita] = useState('');
		const [textoEnvio, setTextoEnvio] = useState('');
		const [modalVisible, setModalVisible] = useState(false);
		const { uniqueId, nome } = route.params;
		const [credito, setCredito] = useState(0);
		const [saldo, setSaldo] = useState(null);
		const apiUrl = route.params?.apiUrl || 'http://172.16.102.5:5000';
		const [isEnabledVisita, setIsEnabledVisita] = useState(false);

		const toggleSwitchVisita = () => {
			if (!isEnabledVisita) {
					setModalVisible(true);
			} else {
					setTextoVisita(''); 
			}
			setIsEnabledVisita(!isEnabledVisita);
	};

		const checkInputVisita = () => {
			if (isEnabledVisita) {
				console.log('checkinput')
				setTextoVisita('');
			} 
		}
		
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
						descricao: textoVisita,
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

		const fechaTexto = (isModalClosed) => {
			setModalVisible(false);
	
			if (!isModalClosed) {

					setTextoVisita('');
					setIsEnabledVisita(false);
			} else {

					setTextoVisita(textoVisita);
			}
			console.log(textoVisita)
		};

		useEffect(() => {
			consultarSaldo(); 
		}, []);
		return (
			<View style={styles.container}>
			<Text style={styles.title}>Bem-vindo (a), {nome}!</Text>
			<Text style={styles.title}>Valor a consumir - R$ {credito}</Text>
			{uniqueId !== '999999' && saldo !== null && (
				<Text style={styles.smallText}>Total consumido no mês: R$ {saldo}</Text>
			)}
			<View styles={styles.nomeInput}>
				<TextModal visible={modalVisible} onClose={fechaTexto} setTextoVisita={setTextoVisita} textoVisita={textoVisita} />
			</View>
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
			<TouchableOpacity onPress={finalizar} style={[styles.evenSmallerButton, { backgroundColor: 'green' }]}>
				<Text style={styles.buttonText}>Finalizar</Text>
			</TouchableOpacity>
			<View style={styles.spacing} />

			<TouchableOpacity onPress={zerarCredito} style={[styles.evenSmallerButton, { backgroundColor: 'red' }]}>
					<Text style={styles.buttonText}>Limpar</Text>
				</TouchableOpacity>
			<View style={styles.spacing} />
			<TouchableOpacity onPress={() => navigation.navigate('Home')} style={[styles.cancelarButton, { backgroundColor: '#6c757d' }]}>
				<Text style={styles.buttonText}>Cancelar</Text>
			</TouchableOpacity>
			<Text style={styles.smallTextVisita}>Consumo para visita?</Text>
			<Switch
				trackColor={{ false: '#767577', true: '#81b0ff' }}
				thumbColor={isEnabledVisita ? '#4771ed' : '#0744fa'}
				ios_backgroundColor="#3e3e3e"
				onValueChange={toggleSwitchVisita}
				value={isEnabledVisita}
				style={styles.switchVisita}
			/>
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
				// options={{ title: 'Colaborador' }}
			/>
			<Stack.Screen
				name="Creditos"
				component={CreditosScreen}
				options={{ headerShown: false }}
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
		containerTextoVisita: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
		},
		openButton: {
			backgroundColor: "#007AFF",
			padding: 10,
			borderRadius: 8,
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
		smallTextVisita: {
			fontSize: 14,
			color: '#555',
			marginTop: 0,
			position: 'absolute',
			top: 133,
			right: 105,
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
		cancelarButton: {
			width: '15%',
			padding: 10,
			borderRadius: 5,
			marginBottom: 10,
		},
		buttonText: {
			color: '#fff',
			fontSize: 16,
			textAlign: 'center',
		},
		buttonTextIniciar: {
			color: '#000000',
			fontSize: 26,
			textAlign: 'center',
			width: 150
		},
		smallButtonIniciar: {
			width: '30%',
			height: 80,
			padding: 10,
			borderRadius: 5,
			marginBottom: 10,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: '#32CD32'
		},
		buttonTextVisita: {
			color: "#fff",
			fontSize: 16,
			fontWeight: "bold",
		},
		dropdownButtonStyle: {
			width: 200,
			height: 50,
			backgroundColor: '#E9ECEF',
			borderRadius: 12,
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: 12,
		},
		dropdownButtonTxtStyle: {
			flex: 1,
			fontSize: 18,
			fontWeight: '500',
			color: '#151E26',
		},
		dropdownButtonArrowStyle: {
			fontSize: 28,
		},
		dropdownButtonIconStyle: {
			fontSize: 28,
			marginRight: 8,
		},
		dropdownMenuStyle: {
			backgroundColor: '#E9ECEF',
			borderRadius: 8,
		},
		dropdownItemStyle: {
			width: '100%',
			flexDirection: 'row',
			paddingHorizontal: 12,
			justifyContent: 'center',
			alignItems: 'center',
			paddingVertical: 8,
		},
		dropdownItemTxtStyle: {
			flex: 1,
			fontSize: 18,
			fontWeight: '500',
			color: '#151E26',
		},
		dropdownItemIconStyle: {
			fontSize: 28,
			marginRight: 8,
		},
		switchVisita: {
			position: 'absolute',
			top: 120,
			right: 50,
		},
		switchInput: {
			top: 5,
		},
	});
