

from flask import Flask, request, jsonify

app = Flask(__name__)

# Mock database for users (replace with a real database in production)
users = {
    "123456": {"nome": "João Silva", "balanco": 50.0},
    "654321": {"nome": "Maria Souza", "balanco": 30.0},
    # Add more users as needed
}

# Endpoint to verify user login
@app.route('/verificar_login', methods=['POST'])
def verificar_login():
    data = request.get_json()
    id_user = data.get('id_user')

    if id_user in users:
        return jsonify({
            "success": True,
            "nome": users[id_user]["nome"]
        })
    else:
        return jsonify({
            "success": False,
            "message": "Usuário não encontrado."
        }), 404

# Endpoint to consult user balance
@app.route('/consulta_saldo', methods=['POST'])
def consulta_saldo():
    data = request.get_json()
    id_user = data.get('id_user')

    if id_user in users:
        return jsonify({
            "success": True,
            "balanco": users[id_user]["balanco"]
        })
    else:
        return jsonify({
            "success": False,
            "message": "Usuário não encontrado."
        }), 404

# Endpoint to add credit for coffee
@app.route('/cafe', methods=['POST'])
def cafe():
    data = request.get_json()
    id_user = data.get('id_user')
    valor = data.get('valor')
    nome = data.get('nome')

    if id_user in users:
        users[id_user]["balanco"] -= valor  # Deduct the credit from the balance
        return jsonify({
            "success": True,
            "message": f"Crédito de R$ {valor:.2f} adicionado para {nome}."
        })
    else:
        return jsonify({
            "success": False,
            "message": "Usuário não encontrado."
        }), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)