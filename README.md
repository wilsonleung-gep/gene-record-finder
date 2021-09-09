Introduction
============

One of the key requirements for students participating in the annotation
projects from the [Genomics Education Partnership](https://thegep.org) is to
construct gene models for all the isoforms of the genes in their project. The
comparative annotation strategy used by the GEP is based on parsimony with the
orthologous gene from the informant genome (i.e. *D. melanogaster*). Hence the
annotation protocol starts with the hypothesis that all the isoforms of a gene
in the *D. melanogaster* ortholog also exist in the target species.

The annotation strategy also begins with the hypothesis that the gene structure
(e.g., the number and relative positions of the exons) are conserved between the
two species. Changes in gene structure must be supported by experimental
evidence (e.g., RNA-Seq data) or by sequence conservation in species that are
more closely-related to the target species.

While many databases (e.g., [NCBI](https://www.ncbi.nlm.nih.gov/),
[Ensembl](https://metazoa.ensembl.org/index.html),
[FlyBase](http://flybase.org/), etc.) already provide research scientists with
substantial amount of information about each gene, these resources are not
optimized for the GEP annotation protocol. For example, because the same exon
can be used by multiple isoforms, students using only the information from the
FlyBase gene record will annotate the same exon multiple times. Hence using
public databases to annotate all the isoforms of a gene is a labor-intensive and
potentially error-prone process.

The [*Gene Record
Finder*](https://gander.wustl.edu/%7ewilson/dmelgenerecord/index.html) is
designed to supplement the information already available from FlyBase. It
enables annotators to quickly identify a unique set of exons for a gene in *D.
melanogaster*. Annotators can also use this tool to retrieve the sequences for
the coding exons (CDSs) and the transcribed exons of a gene. Each CDS is listed
separately, which enables annotators to use the "Align two or more sequences"
functionality provided by NCBI *blastx* and *tblastn* to map each unique CDS
onto their project sequence, and use these alignments to construct a gene model
for each isoform.

Please see the [*Gene Record Finder* User
Guide](https://community.gep.wustl.edu/repository/documentations/Gene_Record_Finder_User_Guide.pdf)
for an overview of the program, and some examples on how to use this program in
practice.


Availability
============

The [*Gene Record
Finder*](https://gander.wustl.edu/%7ewilson/dmelgenerecord/index.html) is
available under the "**Resources & Tools**" section of the [F Element project
page](https://thegep.org/felement/) and the [Pathways project
page](https://thegep.org/pathways/) on the GEP website.



External Dependencies
=====================

* A local [mirror of the *UCSC Genome
  Browser*](https://genome.ucsc.edu/goldenPath/help/mirror.html)
* Database constructed from the [*D. melanogaster* GFF3 annotation
  files](http://ftp.flybase.net/genomes/Drosophila_melanogaster/) provided by
  FlyBase
