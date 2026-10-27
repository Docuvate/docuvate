//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_list_library_ui_dto.g.dart';

/// DocumentListLibraryUiDto
///
/// Properties:
/// * [showDocumentOwnerLine] - When false, hide per-document owner lines in the library (single-user installs).
@BuiltValue()
abstract class DocumentListLibraryUiDto implements Built<DocumentListLibraryUiDto, DocumentListLibraryUiDtoBuilder> {
  /// When false, hide per-document owner lines in the library (single-user installs).
  @BuiltValueField(wireName: r'showDocumentOwnerLine')
  bool get showDocumentOwnerLine;

  DocumentListLibraryUiDto._();

  factory DocumentListLibraryUiDto([void updates(DocumentListLibraryUiDtoBuilder b)]) = _$DocumentListLibraryUiDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentListLibraryUiDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentListLibraryUiDto> get serializer => _$DocumentListLibraryUiDtoSerializer();
}

class _$DocumentListLibraryUiDtoSerializer implements PrimitiveSerializer<DocumentListLibraryUiDto> {
  @override
  final Iterable<Type> types = const [DocumentListLibraryUiDto, _$DocumentListLibraryUiDto];

  @override
  final String wireName = r'DocumentListLibraryUiDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentListLibraryUiDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'showDocumentOwnerLine';
    yield serializers.serialize(
      object.showDocumentOwnerLine,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentListLibraryUiDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentListLibraryUiDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'showDocumentOwnerLine':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.showDocumentOwnerLine = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentListLibraryUiDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentListLibraryUiDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

