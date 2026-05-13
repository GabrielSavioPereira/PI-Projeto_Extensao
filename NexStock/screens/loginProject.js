import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native'; // Adicionado Alert
import { Ionicons, Feather } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from "firebase/auth"; 
import { auth } from '../dbconfig/config.js'; 

export default function Login({ navigation }) {
  
  const [email, setEmail] = useState(''); 
  const [senha, setSenha] = useState(''); 
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  const handleLogin = () => {
    if (email === '' || senha === '') {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    signInWithEmailAndPassword(auth, email, senha)
      .then((userCredential) => {
        Alert.alert("Sucesso", "Bem-vindo ao NexStock!");
        navigation.navigate('HomeScreen'); 
      })
      .catch((error) => {
        let errorMessage = "Erro ao tentar entrar.";
        if (error.code === 'auth/invalid-email') errorMessage = "E-mail inválido.";
        if (error.code === 'auth/user-not-found') errorMessage = "Usuário não encontrado.";
        if (error.code === 'auth/wrong-password') errorMessage = "Senha incorreta.";
        if (error.code === 'auth/invalid-credential') errorMessage = "Credenciais inválidas.";
        
        Alert.alert("Erro", errorMessage);
        console.log(error.code);
      });
  };

  return (
    <View style={styles.container}>
        <View style={styles.topContainer}>
        <Image
          source={require('../assets/logoLogin.png')} 
          style={styles.logo}
          resizeMode="contain"/>
      </View>
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Feather name="mail" size={20} color="#C45F7D" />
          <TextInput
          placeholder="Usuário"
          placeholderTextColor="#C45F7D"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"/>
        </View>
        <View style={styles.inputContainer}>
          <Feather name="lock" size={20} color="#C45F7D" />
          
          <TextInput
            placeholder="Senha"
            placeholderTextColor="#C45F7D"
            secureTextEntry={!senhaVisivel}
            style={styles.input}
            value={senha}
            onChangeText={setSenha}/>

          <TouchableOpacity
            onPress={() => setSenhaVisivel(!senhaVisivel)}>
            <Ionicons
              name={senhaVisivel ? 'eye' : 'eye-off'}
              size={22}
              color="#C45F7D"/>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
        style={styles.button}
        onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.forgot}>
            Esqueci minha senha
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },

  topContainer: {
    height: 300,
    backgroundColor: '#E9C1B9',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius:30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: 250,
    height: 180,
  },

  formContainer: {
    paddingHorizontal: 35,
    marginTop: 60,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#C45F7D',
    marginBottom: 30,
    paddingBottom: 8,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    color: '#C45F7D',
    fontSize: 16,
  },

  button: {
    backgroundColor: '#C45F7D',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },

  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  forgot: {
    textAlign: 'center',
    color: '#C45F7D',
    marginTop: 20,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});