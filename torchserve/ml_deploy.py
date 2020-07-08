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
import logging
import create_torchscript as ts

logger = logging.getLogger(__name__)

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
        print(f"----------------------------------nli is archiving --------------------------------------")
        archiver_command = f'torch-model-archiver --model-name {sagemaker_model_name} --version 1.0 --serialized-file {model_path} --handler {handler_path} --extra-files "{round_path}/settings.py,{round_path}/setup_config.json"'
    
    elif task == "hs" or task == "sentiment" :
        print(f"---------------------------------- hs is archiving --------------------------------------")
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
    process = subprocess.run(f'mv {sagemaker_model_name}.tar.gz {sagemaker_model_name}.mar {task}/mars/',stdout=subprocess.PIPE,stderr = subprocess.STDOUT,universal_newlines=True,check = True, shell = True)
    print(process.stdout)
    
    

def setup_model(model_dir,model_path,model_url_path,given_model_name,extension,round_path):
    
    
    try:
        os.makedirs(model_dir, exist_ok=True)
    except OSError:
        print ("Creation of the directory %s failed" % model_dir)
    else:
        print ("Successfully created the directory %s " % model_dir)

    if os.path.exists(os.path.join(model_dir,given_model_name)):

        print(f"------ Using the model {os.path.exists(os.path.join(model_dir,given_model_name))} ------------")
        
#         os.rename(os.path.join(cur_mode_dir,given_model_name),f"pytorch_model.{extension}")
        
    else :
        print(f"--------------------------------- Model is downloaded in {model_dir} -------------------------------")
        process = subprocess.run(f'wget {model_url_path} -P {model_dir}',stdout=subprocess.PIPE,stderr = subprocess.STDOUT,universal_newlines=True,check = True, shell = True)
        print(process.stdout)
        cur_model_dir = os.getcwd()
    

        
    print(f"------- model renamed from {os.path.join(model_dir,given_model_name)} to {model_path} ----------")
    os.rename(os.path.join(model_dir,given_model_name),model_path)
    
    if extension != "pt":
        ts.create_ts(round_path,model_dir)
        #os.remove(model_path)
        renamed_model_name = "pytorch_model.pt"
        model_path = os.path.join(model_dir,renamed_model_name)
    
    
    return model_path
    
if __name__ == "__main__":
    # user arguments
   
    deploy_config_path = os.path.join(os.getcwd(), "deploy_config.json")

    if os.path.isfile(deploy_config_path):
        with open(deploy_config_path) as deploy_config_file:
                deploy_config = json.load(deploy_config_file)
    else:
        logger.warning('Missing the deploy_config.json file.')
        
    task = deploy_config["task"]
    round_id = deploy_config["round_id"]
    model_no = deploy_config["model_no"]
    model_url_path = deploy_config["model_url"]
    initial_instance_count = deploy_config["initial_instance_count"]
    gateway_url = deploy_config["gateway_url"]
    
    if task == None:
        print("The task is not present in the deploy_config file")
    if round_id == None:
        print("The round_id is not present in the deploy_config file")
        logger.warning("The round_id is not present in the deploy_config file")
    if model_no == None:
        print("The model_no is not present in the deploy_config file")
        logger.warning("The model_no is not present in the deploy_config file")
    if model_url_path == None:
        print("model_url_path is not present in the deploy_config file")
        logger.warning("model_url_path is not present in the deploy_config file")
    if gateway_url == None:
        print("gateway_url is not present in the deploy_config file")
        logger.warning("gateway_url is not present in the deploy_config file")
    
    
    sagemaker_model_name = f'{task}_r{round_id}_{model_no}'
    
        
    
    #-------------------------------------- Model name and model path construction-------------------------------------#
    given_model_name = model_url_path.split("/")[-1]
    extension = given_model_name.split(".")[-1]
    model_name = "pytorch_model."+extension
    model_dir = f'{task}/r{str(round_id)}/r{str(round_id)}_{str(model_no)}'
    model_path = os.path.join(model_dir,model_name)
    round_path = f'{task}/r{str(round_id)}'
    
    s3_folder = task
    registry_name = 'torchserve'
 
    print("----------------------- Set up the model  ------------------------------------")
    ts_model_path = setup_model(model_dir,model_path,model_url_path,given_model_name,extension,round_path)
    
    print("----------------------- Archive model ----------------------------------------")
    archive_model(sagemaker_model_name,ts_model_path,round_path,task)
    
    print("----------------------- Setup sagemaker variables ----------------------------") 
    region,account,prefix,registry_name,role,bucket_name = setup_env()
    
    print("----------------------- Tar file copied to s3 --------------------------------") 
    process = subprocess.run(f'aws s3 cp {task}/mars/{sagemaker_model_name}.tar.gz s3://{bucket_name}/{prefix}/models/{task}/',stdout=subprocess.PIPE,stderr = subprocess.STDOUT,universal_newlines=True,check = True, shell = True)
    print(process.stdout)
    
    print("----------------------- Setup deploy variables -------------------------------") 

    image_label = 'v1'
    image = f'{account}.dkr.ecr.{region}.amazonaws.com/{registry_name}:{image_label}'
    
    model_data = f's3://{bucket_name}/{prefix}/models/{s3_folder}/{sagemaker_model_name}.tar.gz'
    sm_model_name = f'{task}-r{str(round_id)}-{model_no}'

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
    #TO DO : print the exposed endpoint url 
    exposed_endpoint = f'{gateway_url}?model={sm_model_name}'
    print("Model endpoint url = ", exposed_endpoint)
