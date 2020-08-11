# -*- coding: utf-8 -*-
"""
Created on Thu Aug  6 17:32:12 2020

@author: Jooyeon
"""

import sys
import math
#from numpy import dot
#from numpy.linalg import norm


cosineSimilarity = []
proCos= []
rank = 0
name = 'initial'
similarity = ''

def computeCosineSimilarity(vectorArray1, vectorArray2):
    sumxx, sumxy, sumyy = 0, 0, 0

    for vector in range(len(vectorArray1)):
        x = vectorArray1[vector]; 
        y = vectorArray2[vector]
        sumxx += x*x
        sumyy += y*y
        sumxy += x*y
        
    return sumxy/math.sqrt(sumxx*sumyy)


if __name__ == "__main__":

    embeddingSize = int(sys.argv[1])
    keyEmbeddings = sys.argv[2]
    comparedProperties = sys.argv[3]
    comparedEmbeddings = sys.argv[4]
    nodeType = sys.argv[5]
    comparedLabels = sys.argv[6]
    
    if nodeType == 'dataNode' : 
        comparedOwners = sys.argv[7]
    
    #embeddingSize = 6
    #keyEmbeddings = '1,3,4,5,2,3'
    #comparedProperties = 'a,Personb,c,Persond'
    #comparedEmbeddings = '123,123,12,423,5,24,564,36,3,45,34,12,31,2,312,4,23,4,23,5,426,2,34,9.83748'
    #nodeType = 'personNode'
    
    
    keyEmbeddings = keyEmbeddings.split(',')
    keyEmbeddings = [float(vector) for vector in keyEmbeddings]
    comparedProperties = comparedProperties.split(',')
    comparedEmbeddings = comparedEmbeddings.split(',')
    comparedEmbeddings = [float(vector) for vector in comparedEmbeddings]
    if nodeType == 'dataNode' : 
        comparedOwners = comparedOwners.split(',')
        comparedProperties = [comparedProperties[i] + '/' + comparedOwners[i] for i in range((len(comparedProperties)))]
    comparedLabels = comparedLabels.split(',')
    #print(comparedEmbeddings)
    #print(len(comparedEmbeddings))
    #print(comparedLabels)

    comparedProperties = [comparedLabels[i] + '/' + comparedProperties[i] for i in range((len(comparedProperties)))]
    #print(comparedProperties)
    comparedEmbeddings = [comparedEmbeddings[i * embeddingSize:(i + 1) * embeddingSize] for i in range((len(comparedEmbeddings) + embeddingSize - 1) // embeddingSize)] 
    #print(len(comparedEmbeddings))
    #print(comparedEmbeddings)
    for compute in range(len(comparedEmbeddings)) :
        cosineSimilarity.append(computeCosineSimilarity(keyEmbeddings, comparedEmbeddings[compute]))

    for element in range(len(cosineSimilarity)):
       proCos.append([comparedProperties[element], cosineSimilarity[element]])
       
    proCos = sorted(proCos, key=lambda x: -x[1])
    #print(proCos)
    
    if nodeType == 'personNode' :
        for properties in range(len(proCos)) :
            if 'Person' in proCos[properties][0] :
                if name == 'initial' :
                    name = proCos[properties][0]
                    similarity = str(proCos[properties][1])
                else : 
                    name = name + ',' + proCos[properties][0]
                    similarity = similarity + ',' + str(proCos[properties][1])
                
        sentence = name + '+' + similarity
        print(sentence)
        
    elif nodeType == 'dataNode' :
        for properties in range(len(proCos)) :
            if 'Data' in proCos[properties][0] :
                if name == 'initial' :
                    name = proCos[properties][0]
                    similarity = str(proCos[properties][1])
                else : 
                    name = name + ',' + proCos[properties][0]
                    similarity = similarity + ',' + str(proCos[properties][1])
                    
        sentence = name + '+' + similarity
        print(sentence)
        
    else : print ("")
 
    




