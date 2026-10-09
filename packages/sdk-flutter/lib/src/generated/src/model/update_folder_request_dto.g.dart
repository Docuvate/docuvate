// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_folder_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateFolderRequestDto extends UpdateFolderRequestDto {
  @override
  final String? name;
  @override
  final String? parentId;
  @override
  final String? mappeId;

  factory _$UpdateFolderRequestDto(
          [void Function(UpdateFolderRequestDtoBuilder)? updates]) =>
      (UpdateFolderRequestDtoBuilder()..update(updates))._build();

  _$UpdateFolderRequestDto._({this.name, this.parentId, this.mappeId})
      : super._();
  @override
  UpdateFolderRequestDto rebuild(
          void Function(UpdateFolderRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateFolderRequestDtoBuilder toBuilder() =>
      UpdateFolderRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateFolderRequestDto &&
        name == other.name &&
        parentId == other.parentId &&
        mappeId == other.mappeId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, parentId.hashCode);
    _$hash = $jc(_$hash, mappeId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateFolderRequestDto')
          ..add('name', name)
          ..add('parentId', parentId)
          ..add('mappeId', mappeId))
        .toString();
  }
}

class UpdateFolderRequestDtoBuilder
    implements Builder<UpdateFolderRequestDto, UpdateFolderRequestDtoBuilder> {
  _$UpdateFolderRequestDto? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _parentId;
  String? get parentId => _$this._parentId;
  set parentId(String? parentId) => _$this._parentId = parentId;

  String? _mappeId;
  String? get mappeId => _$this._mappeId;
  set mappeId(String? mappeId) => _$this._mappeId = mappeId;

  UpdateFolderRequestDtoBuilder() {
    UpdateFolderRequestDto._defaults(this);
  }

  UpdateFolderRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _parentId = $v.parentId;
      _mappeId = $v.mappeId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateFolderRequestDto other) {
    _$v = other as _$UpdateFolderRequestDto;
  }

  @override
  void update(void Function(UpdateFolderRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateFolderRequestDto build() => _build();

  _$UpdateFolderRequestDto _build() {
    final _$result = _$v ??
        _$UpdateFolderRequestDto._(
          name: name,
          parentId: parentId,
          mappeId: mappeId,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
