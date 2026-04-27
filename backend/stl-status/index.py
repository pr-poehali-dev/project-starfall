import json
import os
import requests

def handler(event: dict, context) -> dict:
    """
    Проверяет статус задачи Meshy.ai по task_id.
    Возвращает статус и ссылку на STL-файл, когда готово.
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

    params = event.get('queryStringParameters') or {}
    task_id = params.get('task_id')

    if not task_id:
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'task_id is required'})}

    api_key = os.environ.get('MESHY_API_KEY')
    if not api_key:
        return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': 'MESHY_API_KEY not configured'})}

    resp = requests.get(
        f'https://api.meshy.ai/openapi/v1/image-to-3d/{task_id}',
        headers={'Authorization': f'Bearer {api_key}'},
        timeout=15,
    )

    if resp.status_code != 200:
        return {
            'statusCode': resp.status_code,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Meshy API error', 'detail': resp.text})
        }

    data = resp.json()
    status = data.get('status', '').lower()

    stl_url = None
    if status == 'succeeded':
        model_urls = data.get('model_urls', {})
        stl_url = model_urls.get('stl') or model_urls.get('obj') or model_urls.get('glb')

    return {
        'statusCode': 200,
        'headers': HEADERS,
        'body': json.dumps({
            'status': status,
            'progress': data.get('progress', 0),
            'stl_url': stl_url,
            'task_error': data.get('task_error'),
        })
    }
