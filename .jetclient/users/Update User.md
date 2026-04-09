```toml
name = 'Update User'
description = '/users/:id'
method = 'PUT'
url = 'https://api.example.com/users/:id'
sortWeight = 4000000
id = 'bad93be2-1bae-4a12-b892-bf95a415417a'

[[headers]]
key = 'Content-Type'
value = 'application/json'

[body]
type = 'PLAIN'
raw = '''
{
    "name": "John Updated",
    "email": "johnupdated@example.com"
}'''
```
