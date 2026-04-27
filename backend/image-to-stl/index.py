import json
import os
import base64
import requests

def handler(event: dict, context) -> dict:
    """
    Принимает фото в base64, отправляет в Meshy.ai image-to-3D API,
    возвращает task_id для последующей проверки статуса.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    HEADERS = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        body = {}

    image_data = body.get('image')
    if not image_data:
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'image field is required'})}

    # image_data может быть data URL: "data:image/jpeg;base64,..."
    if ',' in image_data:
        image_data = image_data.split(',', 1)[1]

    api_key = os.environ.get('MESHY_API_KEY')
    if not api_key:
        return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': 'MESHY_API_KEY not configured'})}

    payload = {
        'image_url': f'data:image/jpeg;base64,{image_data}',
        'enable_pbr': False,
        'should_remesh': True,
        'topology': 'quad',
        'target_polycount': 30000,
    }

    resp = requests.post(
        'https://api.meshy.ai/openapi/v1/image-to-3d',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        json=payload,
        timeout=30,
    )

    if resp.status_code not in (200, 201, 202):
        return {
            'statusCode': resp.status_code,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Meshy API error', 'detail': resp.text})
        }

    data = resp.json()
    task_id = data.get('result') or data.get('id') or data.get('task_id')

    return {
        'statusCode': 200,
        'headers': HEADERS,
        'body': json.dumps({'task_id': task_id})
    }