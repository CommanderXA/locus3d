import json
import pandas as pd
from numpy import nan

data = pd.read_excel("./data/data.xlsx", sheet_name=None)

arr = []
with open("./data/data.json", "w") as f:
    json.dump(arr, f, indent=4)


for i in data.values():
    df = pd.DataFrame(i)
    df = df.fillna(value="null")
    df = df.reset_index(drop=True)
    df = df.transpose()
    df = df.to_dict()

    with open("./data/data.json") as f:
        file = json.load(f)
        file.append(df)

    with open("./data/data.json", "w") as f:
        json.dump(file, f, indent=4)
