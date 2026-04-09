```toml
name = 'Create User'
description = '/users'
method = 'POST'
url = 'https://api.example.com/users'
sortWeight = 2000000
id = '961694e1-fc20-4785-910c-43b53fc229c1'

[[headers]]
key = 'Content-Type'
value = 'application/json'

[body]
type = 'PLAIN'
raw = '''
{
    "name": "John Doe",
    "email": "johndoe@example.com"
}'''
```
