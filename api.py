from flask import Flask, request, jsonify
import mysql.connector
import argparse 

app = Flask(__name__)

db_config = {
    'host': '192.168.1.252',
    'port': '3306',
    'user': 'sgps',
    'password': '6Cx8A3p7',
    'database': 'sgps'
}

def get_db_connection():
    return mysql.connector.connect(**db_config)

@app.route('/verificar_login', methods=['POST'])
def verificar_login():
    data = request.get_json()
    unique_id = data.get('id_user')
    nome = data.get('nome')

    if unique_id:
        try:
            connection = get_db_connection()
            cursor = connection.cursor(dictionary=True)

            query = "SELECT * FROM webusuario WHERE fkIdVendedor = %s and dataInativacao IS NULL"
            cursor.execute(query, (unique_id,))
            user = cursor.fetchone()

            if user:
                return jsonify({
                    "success": True,
                    "nome": user['nome'],
                })
            else:
                return jsonify({
                    "success": False,
                    "message": "Usuário não encontrado."
                }), 404

        except mysql.connector.Error as err:
            print(f"Erro no banco de dados: {err}")
            return jsonify({
                "success": False,
                "message": "Erro no banco de dados."
            }), 500

        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()

    else:
        try:
            connection = get_db_connection()
            cursor = connection.cursor(dictionary=True)
            nome_query = '%' + nome + '%'
            query = "SELECT nome, fkIdVendedor FROM webusuario WHERE nome like %s and dataInativacao IS NULL"
            cursor.execute(query, (nome_query,))
            user = cursor.fetchall()
            print(user)
            if user:
                return jsonify({
                    "success": True,
                    "data": user,
                })
            else:
                return jsonify({
                    "success": False,
                    "message": "Usuário não encontrado."
                }), 404
            
        except mysql.connector.Error as err:
            print(f"Erro no banco de dados: {err}")
            return jsonify({
                "success": False,
                "message": "Erro no banco de dados."
            }), 500

        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()

@app.route('/listar_usuarios', methods=['POST'])
def listar_usuarios():

    data = request.get_json()
    nome = data.get('nome')

    if nome:
        try:
            connection = get_db_connection()
            cursor = connection.cursor(dictionary=True)
            nome_query = '%' + nome + '%'
            query = """SELECT nome FROM webusuario WHERE nome LIKE %s AND dataInativacao IS NULL AND nome NOT LIKE '%\\_%' ESCAPE '\\\\'"""
            cursor.execute(query, (nome_query,))
            user = cursor.fetchall()

            if user:
                return jsonify({
                    "success": True,
                    "data": user,
                })
            else:
                return jsonify({
                    "success": False,
                    "message": "Usuário não encontrado."
                }), 404
            
        except mysql.connector.Error as err:
            print(f"Erro no banco de dados: {err}")
            return jsonify({
                "success": False,
                "message": "Erro no banco de dados."
            }), 500

        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()

@app.route('/consulta_saldo', methods=['POST'])
def consulta_saldo():
    data = request.get_json()
    unique_id = data.get('id_user')

    if not unique_id:
        return jsonify({"success": False, "message": "ID do usuário não fornecido."}), 400

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = "SELECT SUM(valor) AS total_valor FROM cafe WHERE idfunc = %s AND MONTH(data) = MONTH(CURDATE()) AND YEAR(data) = YEAR(CURDATE())"
        cursor.execute(query, (unique_id,))
        result = cursor.fetchone()

        if result:
            return jsonify({
                "success": True,
                "balanco": result['total_valor']
            })
        else:
            return jsonify({
                "success": False,
                "message": "Usuário não encontrado ou saldo zero."
            }), 404

    except mysql.connector.Error as err:
        print(f"Erro no banco de dados: {err}")
        return jsonify({
            "success": False,
            "message": "Erro no banco de dados."
        }), 500

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/cafe', methods=['POST'])
def cafe():
    data = request.get_json()
    unique_id = data.get('id_user')
    valor = data.get('valor')
    nome = data.get('nome')
    descricao = data.get('descricao')
    nomeLimitado = nome[:29]

    if not unique_id or not valor:
        return jsonify({"success": False, "message": "Dados incompletos."}), 400
    


    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        if descricao:
            print('descricao')
            query = """INSERT INTO sgps.cafe (idfunc, nome, valor, descricao, data, hora) VALUES (999999, %s, %s, %s, CURDATE(), CURTIME())"""
            cursor.execute(query, (nomeLimitado, valor, descricao))
        else: 
            print('sem descricao')
            query = """INSERT INTO sgps.cafe (idfunc, nome, valor, data, hora) VALUES (%s, %s, %s, CURDATE(), CURTIME())"""
            cursor.execute(query, (unique_id, nomeLimitado, valor))

        connection.commit()

        if cursor.rowcount > 0:
            return jsonify({
                "success": True,
                "message": f"Crédito de R$ {valor} adicionado para {nome}."
            })
        else:
            return jsonify({
                "success": False,
                "message": "Usuário não encontrado."
            }), 404

    except mysql.connector.Error as err:
        print(f"Erro no banco de dados: {err}")
        return jsonify({
            "success": False,
            "message": "Erro no banco de dados."
        }), 500

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Run the Flask API on a specified port.")
    parser.add_argument('--port', type=int, default=5000, help="Port to run the Flask API on.")
    args = parser.parse_args()

    app.run(host='0.0.0.0', port=args.port, debug=True)
