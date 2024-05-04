# script na analyzu fronty. pro dane datum zjisti, jestli je studena fronta (teplou ignoruju) alespon ve dvou gridovych bodech vedle sebe. pokud ano, udela vektorovy soucet rychlosti a smeru fronty.
# potom z bodu fronty a bodu s nimi sousedicimi ziska maximalni hodnotu gradT. vystup je tabulka ve formatu "datetime   smer    rychlost    maxGradt"
# pokud je v dany datetime vic jak jedna SF, do vystupu jde ta s vyssi hodnotou maxGradT
# WIP

import polars as pl

DATETIME_COLUMN_NAME = 'Datum_[rrrrmmddHH]'

# funkce pro ziskani dict z radku zacinajiciho danym datetimem
def get_row_dict(datetime, df):
    datetime = int(datetime)
    row = df.filter(pl.col(DATETIME_COLUMN_NAME)==datetime)
    row_dict = row.to_dict(as_series=False)
    row_dict.pop(DATETIME_COLUMN_NAME, None)
    row_dict = {key: row_dict[key][0] for key in row_dict}
    return row_dict

def main():
    datetime = 2023081512
    front_df = pl.read_csv('data/fronta.csv')
    print(get_row_dict(datetime, front_df))

if __name__ == '__main__':
    main()