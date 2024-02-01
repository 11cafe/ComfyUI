import ast
import inspect
import textwrap  # Ensure this line is added at the top of your script
import folder_paths


def analyze_class(cls):
    input_types_method = getattr(cls, 'INPUT_TYPES', None)
    if input_types_method:
        class_name = cls.__name__  # Capture the class name
        source = inspect.getsource(input_types_method)
        dedented_source = textwrap.dedent(source)
        parsed_code = ast.parse(dedented_source)
        
        # Initialize a container for calls
        calls = []

        # Define a function to extract calls from ast.Call within ast.Dict
        def extract_calls_from_dict(node):
            if isinstance(node, ast.Dict):
                for key, value in zip(node.keys, node.values):
                    key_name = key.s if hasattr(key, 's') else key.value  # Support for Python versions
                    if isinstance(value, ast.Tuple) or isinstance(value, ast.List):
                        for elt in value.elts:
                            if isinstance(elt, ast.Call) and isinstance(elt.func, ast.Attribute) and elt.func.attr == 'get_filename_list':
                                if isinstance(elt.func.value, ast.Name) and elt.func.value.id == 'folder_paths':
                                    param = ast.unparse(elt.args[0])
                                    calls.append((key_name, param))
                            elif isinstance(elt, ast.BinOp) and isinstance(elt.op, ast.Add):
                                for child in ast.walk(elt):
                                    if isinstance(child, ast.Call) and isinstance(child.func, ast.Attribute) and child.func.attr == 'get_filename_list':
                                        param = ast.unparse(child.args[0])
                                        calls.append((key_name, param))

        # Extract calls from the INPUT_TYPES method
        for node in ast.walk(parsed_code):
            extract_calls_from_dict(node)
        
        # Print the results
        mo_paths=[]
        print(f'👍class {class_name}')
        for key_name, param in calls:
            try:
                print(f'{key_name} ==> {param}')
                abs_path  = folder_paths.folder_names_and_paths.get(param, None)
                print('abs_path',abs_path)
                mo_paths.append({'key':key_name,'path':param,})
            except Exception as e:
                return f"Error adding path: {e}"
        print('111111111paths',mo_paths)
        return mo_paths
