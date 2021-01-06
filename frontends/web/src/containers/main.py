import os
import json

#The number of top scores to display is specified in line 52
#as the 2nd argument in the findTopStudents() function.
#Ex. findTopStudents(students,2) displays the top 2 scoring student json files and their score.
#The title of the json file should match the 1st line of the json file for any new 
#students added.  Ex. studentA.json line 1 should start with: {"studentA":[

APP_FOLDER = './scores'
totalFiles = 0
students = {} 

for base, dirs, files in os.walk(APP_FOLDER):
   print('Searching in : ',base)
  
   for filename in files:
        totalFiles += 1
        score=0
        numberExamples=0
        mer=0
        
        f = open("scores/"+filename, "r")
        z=f.read()
        filenameJSON = json.loads(z)

        for value in filenameJSON.values():
            for record in value:
                
                if record["model_wrong"] == True:
                    score = score+1
                    numberExamples = numberExamples + 1
                else:
                    numberExamples = numberExamples + 1 
            
            anon_uid = record["anon_uid"]
        #print(score,numberExamples, anon_uid)
        student = students.get(anon_uid)
        if student:
            student['examples'] += numberExamples
            student['score'] += score
        else:
            students[anon_uid] = {'examples': numberExamples, 'score': score}

print('Total number of student json files:',totalFiles)

top_students = sorted(students.keys(), key=lambda x: -students[x]['score']/students[x]['examples'])

for uid, values in students.items():
    mer = values['score'] / (1.0 * values['examples'])

    print("anon_uid: {0} score: {1}, number of examples: {2}, MER : {3:.2f} ".format(
       uid, values['score'], values['examples'], mer ))
#print(anon_uid + " score: "+ str(score) +", number of examples: "+ str(numberExamples)+ ", MER: "+str(mer))

print("")
print('The top 2 scoring students/anon_uid are:')
for uid in top_students[0:2]:
    values = students[uid]
    mer = values['score'] / (1.0 * values['examples'])

    print("anon_uid: {0} score: {1}, number of examples: {2}, MER : {3:.2f} ".format(
       uid, values['score'], values['examples'], mer )) 
