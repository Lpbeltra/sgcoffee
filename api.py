from flask import Flask, request, jsonify
import mysql.connector
import argparse 

app = Flask(__name__)

db_config = {
    'host': 'xxxxxx',
    'port': 'xxxxxx',
    'user': 'xxxxxx',
    'password': 'xxxxxx',
    'database': 'xxxxxx'
}

def get_db_connection():
    return mysql.connector.connect(**db_config)

@app.route('/verificar_login', methods=['POST'])
def verificar_login():
    data = request.get_json()
    unique_id = data.get('id_user')

    if not unique_id:
        return jsonify({"success": False, "message": "ID do usuário não fornecido."}), 400

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

    if not unique_id or not valor:
        return jsonify({"success": False, "message": "Dados incompletos."}), 400

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """INSERT INTO sgps.cafe (idfunc, nome, valor, data, hora) VALUES (%s, %s, %s, CURDATE(), CURTIME())"""
        cursor.execute(query, (unique_id, nome, valor))

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
