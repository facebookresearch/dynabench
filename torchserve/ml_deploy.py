import os 
import subprocess
import boto3, time, json
import sagemaker
import shlex
import shutil
from os import path 
from sagemaker.model import Model
from sagemaker.predictor import RealTimePredictor
import argparse
import create_torchscript as ts
import boto3
import requests


def setup_env():
    
    session = boto3.Session()
    region  = session.region_name
    account = boto3.client('sts').get_caller_identity().get('Account')
    
    sagemaker_session = sagemaker.Session(boto_session=session)
    role = sagemaker.get_execution_role()
    bucket_name = sagemaker_session.default_bucket()
    registry_name = 'torchserve'
    prefix = 'torchserve'
    
    return region,account,prefix,registry_name,role,bucket_name

def archive_model(sagemaker_model_name,model_path,round_path,task):
    
    handler_path = os.path.join(os.getcwd(),round_path,"TransformerHandler.py")

    #-------------------------------------- Archive -------------------------------------#
    if task == "nli":
        print(f'----------------------------------nli is archiving --------------------------------------')
        archiver_command = f'torch-model-archiver --model-name {sagemaker_model_name} --version 1.0 --serialized-file {model_path} --handler {handler_path} --extra-files "{round_path}/settings.py,{round_path}/setup_config.json"'
    
    elif task == "hs" or task == "sentiment" :
        print(f'---------------------------------- hs is archiving --------------------------------------')
        archiver_command = f'torch-model-archiver --model-name {sagemaker_model_name} --version 1.0 --serialized-file {model_path} --handler {handler_path} --extra-files "{round_path}/vocab.json,{round_path}/setup_config.json,{round_path}/special_tokens_map.json,{round_path}/settings.py,{round_path}/tokenizer_config.json,{round_path}/merges.txt,{round_path}/config.json"' 
        
    elif task == "qa":
        print("---------------------------------- qa is archiving --------------------------------------")
        archiver_command = f'torch-model-archiver --model-name {sagemaker_model_name} --version 1.0 --serialized-file {model_path} --handler {handler_path} --extra-files "{round_path}/vocab.json,{round_path}/setup_config.json,{round_path}/special_tokens_map.json,{round_path}/settings.py,{round_path}/tokenizer_config.json,{round_path}/merges.txt,{round_path}/qa_utils.py,{round_path}/config.json"'
        print(archiver_command)
            
    print("----------------------------------Model archiving --------------------------------------")
    process = subprocess.run(archiver_command,stdout=subprocess.PIPE,stderr = subprocess.STDOUT,universal_newlines=True,check = True, shell = True)
    print(process.stdout)
    
    print("----------------------------------- Mar file tarred ------------------------------------")
    process = subprocess.run(f'tar cvfz {sagemaker_model_name}.tar.gz {sagemaker_model_name}.mar',stdout=subprocess.PIPE,stderr = subprocess.STDOUT,universal_newlines=True,check = True, shell = True)
    print(process.stdout)

    print("-------------------------------Tar file moved to mars folder ----------------------------")    
    shutil.move(f'{sagemaker_model_name}.tar.gz', f'{task}/mars/{sagemaker_model_name}.tar.gz')
    shutil.move(f'{sagemaker_model_name}.mar', f'{task}/mars/{sagemaker_model_name}.mar')
    

def setup_model(model_dir,model_path,model_url_path,given_model_name,extension,round_path):
    
    
    try:
        os.makedirs(model_dir, exist_ok=True)
    except OSError:
        print (f'Creation of the directory {model_dir} failed')
    else:
        print (f'Successfully created the directory {model_dir}')
        
    if os.path.exists(os.path.join(model_dir,given_model_name)):

        print(f'------ Using the model {os.path.join(model_dir,given_model_name)} ------------')
    else :
        print(f'--------------------------------- Model is downloaded in {model_dir} -------------------------------')
        r = requests.get(model_url_path)

        with open(os.path.join(model_dir,given_model_name), 'wb') as f:
            f.write(r.content)
            
   
    print(f'------- model renamed from {os.path.join(model_dir,given_model_name)} to {model_path} ----------')
    os.rename(os.path.join(model_dir,given_model_name),model_path)
    
    if extension != "pt":
        ts.create_ts(round_path,model_dir)
        #os.remove(model_path)
        renamed_model_name = "pytorch_model.pt"
        model_path = os.path.join(model_dir,renamed_model_name)
    
    return model_path

def load_validate_deploy_config():
    
    deploy_config_path = os.path.join(os.getcwd(), "deploy_config.json")

    if os.path.isfile(deploy_config_path):
        with open(deploy_config_path) as deploy_config_file:
                deploy_config = json.load(deploy_config_file)
    else:
        sys.exit('Missing the deploy_config.json file.')
        
    task = deploy_config["task"]
    round_id = deploy_config["round_id"]
    model_no = deploy_config["model_no"]
    model_url_path = deploy_config["model_url"]
    initial_instance_count = deploy_config["initial_instance_count"]
    gateway_url = deploy_config["gateway_url"]
    
    if task == None:
        sys.exit("The task is not present in the deploy_config file")
    if round_id == None:
        sys.exit("The round_id is not present in the deploy_config file")
    if model_no == None:
        sys.exit("The model_no is not present in the deploy_config file")
    if model_url_path == None:
        sys.exit("model_url_path is not present in the deploy_config file")
    if gateway_url == None:
        sys.exit("gateway_url is not present in the deploy_config file")
    if initial_instance_count == None:
        sys.exit("gateway_url is not present in the deploy_config file")
    
    return task,round_id,model_no,model_url_path,initial_instance_count,gateway_url
    
if __name__ == "__main__":
    # user arguments
    task,round_id,model_no,model_url_path,initial_instance_count,gateway_url = load_validate_deploy_config()
    
    sagemaker_model_name = f'{task}_r{round_id}_{model_no}'

    #-------------------------------------- Model name and model path construction-------------------------------------#

        
    given_model_name = model_url_path.split("/")[-1]
    extension = given_model_name.split(".")[-1]
    model_name = "pytorch_model."+extension
    model_dir = f'{task}/r{str(round_id)}/r{str(round_id)}_{str(model_no)}'
    model_path = os.path.join(model_dir,model_name)
    round_path = f'{task}/r{str(round_id)}'
    
    #If a directory path is given instead of url_path, place the model inside the round's model_number folder (ie qa/r2/r2_2/)
    if os.path.exists(os.path.join(os.getcwd(),model_url_path)):
        
        shutil.move(model_url_path,os.path.join(model_dir,given_model_name))
   
    s3_folder = task
    tar_file_path = f'{task}/mars/{sagemaker_model_name}.tar.gz'
    
    # If tar.gz file is present in the mars folder, then we can directly push it to s3
    if not os.path.exists(tar_file_path):
        
        print("----------------------- Set up the model  ------------------------------------")
        ts_model_path = setup_model(model_dir,model_path,model_url_path,given_model_name,extension,round_path)

        print("----------------------- Archive model ----------------------------------------")
        archive_model(sagemaker_model_name,ts_model_path,round_path,task)
    
    print("----------------------- Setup sagemaker variables ----------------------------") 
    region,account,prefix,registry_name,role,bucket_name = setup_env()
    
    print("----------------------- Tar file copied to s3 --------------------------------") 
    s3_client = boto3.client('s3')
    response = s3_client.upload_file(f'{task}/mars/{sagemaker_model_name}.tar.gz', bucket_name, f'{prefix}/models/{task}/{sagemaker_model_name}.tar.gz')
    print(f'Response from the mar file upload to s3 {response}')
    
    print("----------------------- Setup deploy variables -------------------------------") 

    image_label = 'v1'
    image = f'{account}.dkr.ecr.{region}.amazonaws.com/{registry_name}:{image_label}'
    
    model_data = f's3://{bucket_name}/{prefix}/models/{s3_folder}/{sagemaker_model_name}.tar.gz'
    sm_model_name = f'{task}-r{str(round_id)}-{model_no}'
    # Create model in sagemaker by loading the archive in tar file
    torchserve_model = Model(model_data = model_data, 
                         image = image,
                         role  = role,
                         predictor_cls=RealTimePredictor,
                         name  = sm_model_name)
    print("-----------------------Creating endpoint -------------------------------------")
    
    endpoint_name = sm_model_name
    #Change the initial_instance_count to the number of instances you want to be launched.
    predictor = torchserve_model.deploy(instance_type='ml.c5.2xlarge',
                                    initial_instance_count=initial_instance_count,
                                    endpoint_name = endpoint_name)
    exposed_endpoint = f'{gateway_url}?model={sm_model_name}'
    print("Model endpoint url = ", exposed_endpoint)
