import redis
import os
from dotenv import load_dotenv

load_dotenv() 

redisClient = redis.Redis(host=os.getenv("REDIS_HOST"), 
                          port=os.getenv("REDIS_PORT"), 
                          db=os.getenv("REDIS_DB"))