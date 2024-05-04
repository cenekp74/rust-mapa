# script na smazani bodu na 45.5 a 54.5 rovnobezce

import polars as pl
import numpy as np

df = pl.read_csv('data/vZon.csv')
for x in np.arange(10, 20, 1.5):
    df = df.drop(f'[{x};45.5]', f'[{x};54.5]')
    x = int(x)
    df = df.drop(f'[{x};45.5]', f'[{x};54.5]')
df.write_csv('test.csv')