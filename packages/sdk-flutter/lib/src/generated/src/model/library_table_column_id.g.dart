// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'library_table_column_id.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const LibraryTableColumnId _$title = const LibraryTableColumnId._('title');
const LibraryTableColumnId _$labels = const LibraryTableColumnId._('labels');
const LibraryTableColumnId _$date = const LibraryTableColumnId._('date');
const LibraryTableColumnId _$status = const LibraryTableColumnId._('status');
const LibraryTableColumnId _$folder = const LibraryTableColumnId._('folder');
const LibraryTableColumnId _$updated = const LibraryTableColumnId._('updated');

LibraryTableColumnId _$valueOf(String name) {
  switch (name) {
    case 'title':
      return _$title;
    case 'labels':
      return _$labels;
    case 'date':
      return _$date;
    case 'status':
      return _$status;
    case 'folder':
      return _$folder;
    case 'updated':
      return _$updated;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<LibraryTableColumnId> _$values =
    new BuiltSet<LibraryTableColumnId>(const <LibraryTableColumnId>[
  _$title,
  _$labels,
  _$date,
  _$status,
  _$folder,
  _$updated,
]);

class _$LibraryTableColumnIdMeta {
  const _$LibraryTableColumnIdMeta();
  LibraryTableColumnId get title => _$title;
  LibraryTableColumnId get labels => _$labels;
  LibraryTableColumnId get date => _$date;
  LibraryTableColumnId get status => _$status;
  LibraryTableColumnId get folder => _$folder;
  LibraryTableColumnId get updated => _$updated;
  LibraryTableColumnId valueOf(String name) => _$valueOf(name);
  BuiltSet<LibraryTableColumnId> get values => _$values;
}

mixin _$LibraryTableColumnIdMixin {
  // ignore: non_constant_identifier_names
  _$LibraryTableColumnIdMeta get LibraryTableColumnId =>
      const _$LibraryTableColumnIdMeta();
}

Serializer<LibraryTableColumnId> _$libraryTableColumnIdSerializer =
    new _$LibraryTableColumnIdSerializer();

class _$LibraryTableColumnIdSerializer
    implements PrimitiveSerializer<LibraryTableColumnId> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'title': 'title',
    'labels': 'labels',
    'date': 'date',
    'status': 'status',
    'folder': 'folder',
    'updated': 'updated',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'title': 'title',
    'labels': 'labels',
    'date': 'date',
    'status': 'status',
    'folder': 'folder',
    'updated': 'updated',
  };

  @override
  final Iterable<Type> types = const <Type>[LibraryTableColumnId];
  @override
  final String wireName = 'LibraryTableColumnId';

  @override
  Object serialize(Serializers serializers, LibraryTableColumnId object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  LibraryTableColumnId deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      LibraryTableColumnId.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
